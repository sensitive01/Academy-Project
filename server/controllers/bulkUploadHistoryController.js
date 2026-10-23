const mongoose = require('mongoose');
const BulkUploadHistory = require('../models/BulkUploadHistory');

// @desc    Record a bulk upload history
// @route   POST /api/bulk-upload-history
// @access  Private (Admin, HR, Center)
const recordBulkUpload = async (req, res) => {
  try {
    const { module, totalRecords, successfulRecords, failedRecords, status, summary, batchId, affectedRecords } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload the original file.' });
    }

    let parsedAffected = [];
    if (affectedRecords) {
      try {
        parsedAffected = typeof affectedRecords === 'string' ? JSON.parse(affectedRecords) : affectedRecords;
      } catch (e) {
        parsedAffected = [];
      }
    }

    const history = await BulkUploadHistory.create({
      module,
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      status: status || 'Success',
      totalRecords: parseInt(totalRecords) || 0,
      successfulRecords: parseInt(successfulRecords) || 0,
      failedRecords: parseInt(failedRecords) || 0,
      summary,
      batchId: batchId || '',
      affectedRecords: parsedAffected
    });

    res.status(201).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get bulk upload history for a specific module
// @route   GET /api/bulk-upload-history/:module
// @access  Private
const getBulkUploadHistory = async (req, res) => {
  try {
    const { module } = req.params;
    
    const history = await BulkUploadHistory.find({ module })
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Revert and delete bulk upload history and all associated data
// @route   DELETE /api/bulk-upload-history/:id
// @access  Private
const deleteBulkUploadHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await BulkUploadHistory.findById(id);
    if (!history) {
      return res.status(404).json({ message: 'History record not found' });
    }

    let revertedCount = 0;

    if (history.module === 'Fees') {
      const StudentFee = require('../models/StudentFee');
      const Student = require('../models/Student');

      // Strategy 1: Revert by batchId if available
      if (history.batchId) {
        const feesToUpdate = await StudentFee.find({
          'payments.bulkUploadBatch': history.batchId
        });

        for (const fee of feesToUpdate) {
          const initialLen = fee.payments.length;
          fee.payments = fee.payments.filter(p => p.bulkUploadBatch !== history.batchId);
          revertedCount += (initialLen - fee.payments.length);

          const totalPaid = fee.payments
            .filter(p => p.status === 'Approved')
            .reduce((acc, curr) => acc + curr.amount, 0);
          const totalDue = fee.amount +
            (fee.isPenaltyApplied ? fee.penaltyAmount : 0) +
            (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0);

          fee.status = totalPaid >= totalDue ? 'paid' : 'pending';
          fee.markModified('payments');
          await fee.save();
        }
      }
      // Strategy 2: Revert by affectedRecords if available
      else if (history.affectedRecords && history.affectedRecords.length > 0) {
        const feeIds = [...new Set(history.affectedRecords.map(r => r.feeId ? r.feeId.toString() : r.toString()))];
        for (const fId of feeIds) {
          const fee = await StudentFee.findById(fId);
          if (fee) {
            const paymentIdsToRemove = new Set(
              history.affectedRecords
                .filter(r => (r.feeId ? r.feeId.toString() : r.toString()) === fId.toString())
                .map(r => r.paymentId?.toString())
            );
            const initialLen = fee.payments.length;
            fee.payments = fee.payments.filter(p => !paymentIdsToRemove.has(p._id?.toString()));
            revertedCount += (initialLen - fee.payments.length);

            const totalPaid = fee.payments
              .filter(p => p.status === 'Approved')
              .reduce((acc, curr) => acc + curr.amount, 0);
            const totalDue = fee.amount +
              (fee.isPenaltyApplied ? fee.penaltyAmount : 0) +
              (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0);

            fee.status = totalPaid >= totalDue ? 'paid' : 'pending';
            fee.markModified('payments');
            await fee.save();
          }
        }
      }
      // Strategy 3: Backwards compatibility for past uploads without batchId / affectedRecords
      else if (history.fileUrl) {
        try {
          const XLSX = require('xlsx');
          const fileRes = await fetch(history.fileUrl);
          if (fileRes.ok) {
            const arrayBuf = await fileRes.arrayBuffer();
            const wb = XLSX.read(Buffer.from(arrayBuf), { type: 'buffer' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            for (const row of rows) {
              const status = row.Status || row['Upload Status'];
              if (status && String(status).toLowerCase() === 'failed') continue;

              const sId = row.studentId || row['Student ID'];
              const pAmt = Number(row.paidAmount || row['Paid Amt'] || row['Paid Amount']);
              if (!sId || isNaN(pAmt) || pAmt <= 0) continue;

              const student = await Student.findOne({ studentId: String(sId).trim() });
              if (!student) continue;

              const fees = await StudentFee.find({ student: student._id });
              for (const fee of fees) {
                const pIdx = fee.payments.findIndex(p => {
                  return Number(p.amount) === pAmt && (p.paymentMode === 'Cash' || !p.paymentMode);
                });

                if (pIdx !== -1) {
                  fee.payments.splice(pIdx, 1);
                  revertedCount++;

                  const totalPaid = fee.payments
                    .filter(p => p.status === 'Approved')
                    .reduce((acc, curr) => acc + curr.amount, 0);
                  const totalDue = fee.amount +
                    (fee.isPenaltyApplied ? fee.penaltyAmount : 0) +
                    (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0);

                  fee.status = totalPaid >= totalDue ? 'paid' : 'pending';
                  fee.markModified('payments');
                  await fee.save();
                  break;
                }
              }
            }
          }
        } catch (fileErr) {
          console.error("Error reading history file for revert:", fileErr);
        }
      }
    } else if (history.module === 'Attendance') {
      const Attendance = require('../models/Attendance');
      const User = require('../models/User');
      const Student = require('../models/Student');
      const Employee = require('../models/Employee');

      if (history.fileUrl) {
        try {
          const XLSX = require('xlsx');
          const fileRes = await fetch(history.fileUrl);
          if (fileRes.ok) {
            const arrayBuf = await fileRes.arrayBuffer();
            const wb = XLSX.read(Buffer.from(arrayBuf), { type: 'buffer' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            for (const row of rows) {
              const status = row.Status || row['Upload Status'];
              if (status && String(status).toLowerCase() === 'failed') continue;

              const rawId = row.userId || row['User ID'] || row['Employee ID'] || row['Student ID'] || row['Emp ID'];
              const rawDate = row.date || row['Date'];
              if (!rawId || !rawDate) continue;

              let targetUserId = null;
              if (mongoose.Types.ObjectId.isValid(rawId)) {
                targetUserId = rawId;
              } else {
                const idStr = String(rawId).trim();
                const u = await User.findOne({ $or: [{ email: idStr }, { phone: idStr }] });
                if (u) {
                  targetUserId = u._id;
                } else {
                  const s = await Student.findOne({ studentId: idStr });
                  if (s && s.user) targetUserId = s.user;
                  else {
                    const emp = await Employee.findOne({ empId: idStr });
                    if (emp && emp.user) targetUserId = emp.user;
                  }
                }
              }

              if (targetUserId) {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                  d.setHours(0, 0, 0, 0);
                  const nextDay = new Date(d);
                  nextDay.setDate(d.getDate() + 1);

                  const delRes = await Attendance.deleteMany({
                    userId: targetUserId,
                    date: { $gte: d, $lt: nextDay }
                  });
                  revertedCount += delRes.deletedCount;
                }
              }
            }
          }
        } catch (attErr) {
          console.error("Error reading attendance history file for revert:", attErr);
        }
      }
    } else if (history.module === 'Marks') {
      const Mark = require('../models/Mark');
      const Student = require('../models/Student');
      const Subject = require('../models/Subject');

      if (history.fileUrl) {
        try {
          const XLSX = require('xlsx');
          const fileRes = await fetch(history.fileUrl);
          if (fileRes.ok) {
            const arrayBuf = await fileRes.arrayBuffer();
            const wb = XLSX.read(Buffer.from(arrayBuf), { type: 'buffer' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            for (const row of rows) {
              const status = row.Status || row['Upload Status'];
              if (status && String(status).toLowerCase() === 'failed') continue;

              const sId = row['Student ID'] || row.studentId;
              if (!sId) continue;

              const student = await Student.findOne({ studentId: String(sId).trim() });
              if (!student) continue;

              const semesterStr = String(row['Semester'] || '1').replace(/\D/g, '');
              const semester = parseInt(semesterStr, 10);

              const subjectCodes = [];
              if (row['Subject Code']) subjectCodes.push(String(row['Subject Code']).split(' - ')[0].trim());
              for (let j = 1; j <= 20; j++) {
                if (row[`Subject ${j} Code`]) {
                  subjectCodes.push(String(row[`Subject ${j} Code`]).split(' - ')[0].trim());
                }
              }

              for (const code of subjectCodes) {
                const regexCode = new RegExp('^\\s*' + code.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + '\\s*$', 'i');
                const subjectDoc = await Subject.findOne({ code: regexCode });
                if (subjectDoc) {
                  const delRes = await Mark.deleteMany({
                    student: student._id,
                    subject: subjectDoc._id,
                    ...(isNaN(semester) ? {} : { semester })
                  });
                  revertedCount += delRes.deletedCount;
                }
              }
            }
          }
        } catch (markErr) {
          console.error("Error reading marks history file for revert:", markErr);
        }
      }
    } else if (history.module === 'Payroll') {
      const Payroll = require('../models/Payroll');
      const Employee = require('../models/Employee');
      const Student = require('../models/Student');

      if (history.fileUrl) {
        try {
          const XLSX = require('xlsx');
          const fileRes = await fetch(history.fileUrl);
          if (fileRes.ok) {
            const arrayBuf = await fileRes.arrayBuffer();
            const wb = XLSX.read(Buffer.from(arrayBuf), { type: 'buffer' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            for (const row of rows) {
              const status = row.Status || row['Upload Status'];
              if (status && String(status).toLowerCase() === 'failed') continue;

              const rawEmpId = row.employeeId || row['Employee ID'];
              const month = row.month || row['Month'];
              const year = row.year || row['Year'];
              if (!rawEmpId || !month || !year) continue;

              let targetEmpId = null;
              if (mongoose.Types.ObjectId.isValid(rawEmpId)) {
                targetEmpId = rawEmpId;
              } else {
                const emp = await Employee.findOne({ empId: String(rawEmpId).trim() });
                if (emp) targetEmpId = emp._id;
                else {
                  const stu = await Student.findOne({ studentId: String(rawEmpId).trim() });
                  if (stu) targetEmpId = stu._id;
                }
              }

              if (targetEmpId) {
                const payroll = await Payroll.findOne({
                  employee: targetEmpId,
                  month: Number(month),
                  year: Number(year)
                });

                if (payroll) {
                  payroll.totalAllowances = 0;
                  payroll.totalDeductions = 0;
                  payroll.totalCourseFee = 0;
                  payroll.totalCouncilFee = 0;
                  payroll.totalExamFee = 0;
                  payroll.adjustments = [];

                  payroll.netSalary = Math.max(0, (payroll.basicSalary || 0) - (payroll.advance || 0));
                  await payroll.save();
                  revertedCount++;
                }
              }
            }
          }
        } catch (payErr) {
          console.error("Error reading payroll history file for revert:", payErr);
        }
      }
    } else if (history.module === 'Students') {
      const Student = require('../models/Student');
      const User = require('../models/User');
      const Batch = require('../models/Batch');
      const StudentFee = require('../models/StudentFee');

      if (history.fileUrl) {
        try {
          const XLSX = require('xlsx');
          const fileRes = await fetch(history.fileUrl);
          if (fileRes.ok) {
            const arrayBuf = await fileRes.arrayBuffer();
            const wb = XLSX.read(Buffer.from(arrayBuf), { type: 'buffer' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            for (const row of rows) {
              const status = row.Status || row['Upload Status'];
              if (status && String(status).toLowerCase() === 'failed') continue;

              const sId = row['Student ID'] || row.studentId;
              const email = row['Email'] || row.email;
              if (!sId && !email) continue;

              const query = [];
              if (sId) query.push({ studentId: String(sId).trim() });
              if (email) query.push({ email: String(email).trim().toLowerCase() });

              const student = await Student.findOne({ $or: query });
              if (student) {
                // 1. Remove student from any Batch
                await Batch.updateMany(
                  { students: student._id },
                  { $pull: { students: student._id } }
                );

                // 2. Delete StudentFee structures created for this student
                await StudentFee.deleteMany({ student: student._id });

                // 3. Delete user account
                if (student.user) {
                  await User.findByIdAndDelete(student.user);
                }

                // 4. Delete student profile
                await student.deleteOne();
                revertedCount++;
              }
            }
          }
        } catch (stuErr) {
          console.error("Error reading student history file for revert:", stuErr);
        }
      }
    }

    // Delete history entry
    await history.deleteOne();

    res.json({
      message: `Upload file and ${revertedCount} associated ${history.module.toLowerCase()} record(s) deleted successfully`,
      revertedCount
    });
  } catch (error) {
    console.error("Revert Bulk Upload Error:", error);
    res.status(500).json({ message: 'Server error during revert', error: error.message });
  }
};

module.exports = {
  recordBulkUpload,
  getBulkUploadHistory,
  deleteBulkUploadHistory
};
