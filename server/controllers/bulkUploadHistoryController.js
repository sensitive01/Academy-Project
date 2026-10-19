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
    }

    // Delete history entry
    await history.deleteOne();

    res.json({
      message: `Upload file and ${revertedCount} associated payment records deleted successfully`,
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
