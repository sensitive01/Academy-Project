const express = require('express');
const router = express.Router();
const StudentFee = require('../models/StudentFee');
const Center = require('../models/Center');
const Student = require('../models/Student');
const { protect } = require('../middleware/authMiddleware');
const { createInAppNotification } = require('../utils/notificationUtils');


// Get all student fees
router.get('/', protect, async (req, res) => {
  try {
    let fees = await StudentFee.find()
      .populate({
        path: 'student',
        select: 'studentNameEnglish studentId year',
        match: { status: { $ne: 'inactive' } }
      })
      .populate('center', 'name bankDetails')
      .populate('course', 'title')
      .populate('batch', 'name')
      .populate('payments.approvedBy', 'name')
      .sort({ createdAt: -1 });
      
    // Dynamically apply penalties for pending fees
    const now = new Date();
    let updatedFees = false;

    fees = fees.filter(f => f.student != null);
    fees = await Promise.all(fees.map(async (fee) => {
      let needsSave = false;
      
      if (fee.status === 'pending') {
        if (fee.dueDate && !fee.isPenaltyApplied && now > fee.dueDate) {
          fee.isPenaltyApplied = true;
          needsSave = true;
        }
        
        if (fee.finalDueDate && !fee.isFinalPenaltyApplied && now > fee.finalDueDate) {
          fee.isFinalPenaltyApplied = true;
          needsSave = true;
        }
      }
      
      if (needsSave) {
        updatedFees = true;
        return await fee.save();
      }
      return fee;
    }));

    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk Upload Fees
router.post('/bulk-upload', protect, async (req, res) => {
  try {
    const { fees } = req.body;
    if (!fees || !Array.isArray(fees)) {
      return res.status(400).json({ message: "Invalid payload format. Expected an array of fees." });
    }

    let successCount = 0;
    let failedRows = [];

    for (let i = 0; i < fees.length; i++) {
      const row = fees[i];
      const { studentId, year, feeType, totalAmount, paidAmount, paymentMode, bankReference, paidDate } = row;
      
      if (!studentId || !feeType || !totalAmount || !paidAmount) {
        failedRows.push({ row: i + 2, reason: "Missing required fields (Student ID, Fee Type, Total Amount, Paid Amount)" });
        continue;
      }

      // Lookup student
      const student = await Student.findOne({ studentId });
      if (!student) {
        failedRows.push({ row: i + 2, reason: `Student ID ${studentId} not found` });
        continue;
      }

      // Parse feeType
      let parsedFeeType = 'Other';
      let parsedOtherFeeType = '';
      const fTypeLower = feeType.toString().toLowerCase();
      
      if (fTypeLower === 'council' || fTypeLower === 'council fee' || fTypeLower === 'council fees') {
        parsedFeeType = 'Council';
      } else if (fTypeLower === 'course' || fTypeLower === 'course fee' || fTypeLower === 'course fees') {
        parsedFeeType = 'Other';
        parsedOtherFeeType = 'Course Fees';
      } else if (['term', 'sem', 'exam', 'monthly'].includes(fTypeLower)) {
        parsedFeeType = feeType.charAt(0).toUpperCase() + feeType.slice(1).toLowerCase();
      } else {
        parsedFeeType = 'Other';
        parsedOtherFeeType = feeType;
      }

      const academicYear = year ? String(year) : (student.year || "1");
      const targetYearNum = parseInt(academicYear, 10);
      const limitYear = (!isNaN(targetYearNum) && targetYearNum > 0) ? targetYearNum : 1;

      for (let y = 1; y <= limitYear; y++) {
        const loopYearStr = String(y);

        const feesForType = await StudentFee.find({
          student: student._id,
          feeType: parsedFeeType,
          ...(parsedOtherFeeType ? { otherFeeType: parsedOtherFeeType } : {})
        });

        let existingFee = feesForType.find(f => {
          const match = String(f.year || "").match(/\d+/);
          return match && String(match[0]) === loopYearStr;
        });

        if (y === limitYear) {
          let finalPaidDate = new Date();
          if (paidDate) {
            const pdStr = String(paidDate).trim();
            const mmYyyyMatch = pdStr.match(/^(\d{1,2})[-/](\d{4})$/);
            if (mmYyyyMatch) {
              finalPaidDate = new Date(parseInt(mmYyyyMatch[2], 10), parseInt(mmYyyyMatch[1], 10) - 1, 1);
            } else {
              const d = new Date(pdStr);
              if (!isNaN(d.getTime())) finalPaidDate = d;
            }
          }

          const paymentDetail = {
            amount: Number(paidAmount),
            paymentMode: paymentMode || 'Cash',
            bankReference: bankReference || '',
            status: 'Approved',
            paidAt: finalPaidDate
          };

          if (existingFee) {
            if (!existingFee.course || !existingFee.batch) {
              existingFee.course = student.enrolledCourses && student.enrolledCourses.length > 0 ? student.enrolledCourses[0].course : null;
              existingFee.batch = student.enrolledCourses && student.enrolledCourses.length > 0 ? student.enrolledCourses[0].batch : null;
            }

            existingFee.payments.push(paymentDetail);
            
            const totalPaid = existingFee.payments.filter(p => p.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0);
            const totalDue = existingFee.amount + 
                             (existingFee.isPenaltyApplied ? existingFee.penaltyAmount : 0) + 
                             (existingFee.isFinalPenaltyApplied ? existingFee.finalPenaltyAmount : 0);
                             
            if (totalPaid >= totalDue) {
              existingFee.status = 'paid';
            } else {
              existingFee.status = 'pending';
            }
            await existingFee.save();
          } else {
            const studentCourse = student.enrolledCourses && student.enrolledCourses.length > 0 ? student.enrolledCourses[0].course : null;
            const studentBatch = student.enrolledCourses && student.enrolledCourses.length > 0 ? student.enrolledCourses[0].batch : null;

            const newFee = new StudentFee({
              student: student._id,
              center: student.center,
              course: studentCourse,
              batch: studentBatch,
              year: loopYearStr,
              feeType: parsedFeeType,
              otherFeeType: parsedOtherFeeType,
              amount: Number(totalAmount),
              status: Number(paidAmount) >= Number(totalAmount) ? 'paid' : 'pending',
              payments: [paymentDetail]
            });
            await newFee.save();
          }
        } else {
          // Previous years: create if not exists
          if (!existingFee) {
            const studentCourse = student.enrolledCourses && student.enrolledCourses.length > 0 ? student.enrolledCourses[0].course : null;
            const studentBatch = student.enrolledCourses && student.enrolledCourses.length > 0 ? student.enrolledCourses[0].batch : null;

            const newFee = new StudentFee({
              student: student._id,
              center: student.center,
              course: studentCourse,
              batch: studentBatch,
              year: loopYearStr,
              feeType: parsedFeeType,
              otherFeeType: parsedOtherFeeType,
              amount: Number(totalAmount),
              status: 'pending',
              payments: []
            });
            await newFee.save();
          }
        }
      }
      
      successCount++;
    }

    res.json({ successCount, failedCount: failedRows.length, failedRows });
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    res.status(500).json({ message: "Internal server error during bulk upload." });
  }
});

// Create new student fee
router.post('/', protect, async (req, res) => {
  try {
    const { 
      student, center, course, batch, feeType, otherFeeType, 
      terms, amount, status,
      dueDate, penaltyAmount, finalDueDate, finalPenaltyAmount 
    } = req.body;
    
    const fee = await StudentFee.create({
      student,
      center,
      course,
      batch,
      feeType,
      otherFeeType,
      terms,
      amount,
      status: status || 'pending',
      dueDate,
      penaltyAmount: penaltyAmount || 0,
      finalDueDate,
      finalPenaltyAmount: finalPenaltyAmount || 0
    });

    await fee.populate('student', 'studentNameEnglish studentId user');
    await fee.populate('center', 'name bankDetails');
    await fee.populate('course', 'title');
    await fee.populate('batch', 'name');

    // Notify student
    if (fee.student && fee.student.user) {
      await createInAppNotification({
        recipient: fee.student.user,
        sender: req.user._id,
        type: "fee_assigned",
        title: "New Fee Assigned",
        message: `A new fee of ₹${amount} has been assigned to you.`,
        entityId: fee._id.toString()
      });
    }

    res.status(201).json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle status
router.patch('/:id/toggle-status', protect, async (req, res) => {
  try {
    const fee = await StudentFee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    fee.status = fee.status === 'paid' ? 'pending' : 'paid';
    await fee.save();
    
    await fee.populate('student', 'studentNameEnglish studentId user');
    await fee.populate('center', 'name bankDetails');
    await fee.populate('course', 'title');
    await fee.populate('batch', 'name');

    // Notify student if paid
    if (fee.status === 'paid' && fee.student && fee.student.user) {
      await createInAppNotification({
        recipient: fee.student.user,
        sender: req.user._id,
        type: "fee_paid",
        title: "Fee Payment Successful",
        message: `Your fee payment of ₹${fee.amount} has been successfully recorded.`,
        entityId: fee._id.toString()
      });
    }

    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete student fee
router.delete('/:id', protect, async (req, res) => {
  try {
    const fee = await StudentFee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    await fee.deleteOne();
    res.json({ message: 'Fee record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cascade collection for a student's grouped fees (Course, Council, or Other)
router.post('/collect-cascade', protect, async (req, res) => {
  try {
    const { studentId, feeType, paymentMode, proofOfPayment, bankReference, amount, year } = req.body;
    
    // Find all student fee records for this student that are not fully paid
    let query = {
      student: studentId,
      status: { $ne: 'paid' }
    };
    if (year) {
      if (year === "Unknown Year") {
        query.$or = [
          { year: { $exists: false } },
          { year: null },
          { year: "" },
          { year: "Unknown Year" }
        ];
      } else {
        const match = year.match(/\d+/);
        if (match) {
          const digit = match[0];
          query.$or = [
            { year: year },
            { year: new RegExp(`^${digit}$`, 'i') },
            { year: new RegExp(`\\b${digit}\\b`, 'i') },
            { year: { $exists: false } },
            { year: null },
            { year: "" }
          ];
        } else {
          query.$or = [
            { year: year },
            { year: { $exists: false } },
            { year: null },
            { year: "" }
          ];
        }
      }
    }
    let feeRecords = await StudentFee.find(query);

    // Filter by feeType matching logic
    feeRecords = feeRecords.filter(f => {
      if (feeType === 'Council') return f.feeType === 'Council' || (f.feeType === 'Other' && f.otherFeeType === 'Council Fees');
      if (feeType === 'Course') return ['Course', 'Sem', 'Term', 'Monthly'].includes(f.feeType) || (f.feeType === 'Other' && f.otherFeeType === 'Course Fees');
      if (feeType === 'Other') return f.feeType === 'Other' && f.otherFeeType !== 'Council Fees' && f.otherFeeType !== 'Course Fees';
      return f.feeType === feeType;
    });

    if (feeRecords.length === 0) {
      return res.status(400).json({ message: 'No pending fees found for this student and category' });
    }

    let remainingAmountToAllocate = Number(amount);
    if (isNaN(remainingAmountToAllocate) || remainingAmountToAllocate <= 0) {
      return res.status(400).json({ message: 'Valid collection amount is required' });
    }

    // Sort records oldest first (createdAt)
    feeRecords.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const modifiedFees = [];

    for (const fee of feeRecords) {
      if (remainingAmountToAllocate <= 0) break;

      const totalApprovedPaid = fee.payments
        ? fee.payments.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0)
        : 0;

      const totalDue = fee.amount + 
        (fee.isPenaltyApplied ? fee.penaltyAmount : 0) + 
        (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0);

      const balance = Math.max(0, totalDue - totalApprovedPaid);
      if (balance <= 0) continue;

      const allocate = Math.min(remainingAmountToAllocate, balance);

      if (!fee.payments) {
        fee.payments = [];
      }

      fee.payments.push({
        amount: allocate,
        paymentMode,
        proofOfPayment,
        bankReference,
        status: 'Pending',
        paidAt: new Date()
      });

      fee.paymentMode = paymentMode;

      if (paymentMode === 'Cash') {
        fee.status = 'pending_approval';
        fee.approvalStatus = 'Pending';
      } else if (paymentMode === 'Online') {
        fee.status = 'pending_approval';
        fee.proofOfPayment = proofOfPayment;
        fee.approvalStatus = 'Pending';
      } else if (paymentMode === 'Bank') {
        fee.status = 'pending_approval';
        fee.bankReference = bankReference;
        fee.approvalStatus = 'Pending';
      }

      fee.markModified('payments');
      await fee.save();
      modifiedFees.push(fee);

      remainingAmountToAllocate -= allocate;
    }

    res.json({ message: 'Allocated successfully', modifiedFees });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Collect student fee
router.post('/:id/collect', protect, async (req, res) => {
  try {
    const { paymentMode, proofOfPayment, bankReference, amount } = req.body;
    const fee = await StudentFee.findById(req.params.id);
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (fee.status === 'paid') {
      return res.status(400).json({ message: 'Fee is already paid' });
    }

    // Determine collection amount (default to remaining balance if not provided)
    const totalApprovedPaid = fee.payments
      ? fee.payments.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0)
      : 0;

    const totalDue = fee.amount + 
      (fee.isPenaltyApplied ? fee.penaltyAmount : 0) + 
      (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0);

    const remainingBalance = Math.max(0, totalDue - totalApprovedPaid);
    const collectAmount = amount !== undefined ? Number(amount) : remainingBalance;

    if (collectAmount <= 0) {
      return res.status(400).json({ message: 'Collection amount must be greater than zero' });
    }

    if (!fee.payments) {
      fee.payments = [];
    }

    fee.payments.push({
      amount: collectAmount,
      paymentMode,
      proofOfPayment,
      bankReference,
      status: 'Pending',
      paidAt: new Date()
    });

    fee.paymentMode = paymentMode;

    if (paymentMode === 'Cash') {
      fee.status = 'pending_approval';
      fee.approvalStatus = 'Pending';
    } else if (paymentMode === 'Online') {
      fee.status = 'pending_approval';
      fee.proofOfPayment = proofOfPayment;
      fee.approvalStatus = 'Pending';
    } else if (paymentMode === 'Bank') {
      fee.status = 'pending_approval';
      fee.bankReference = bankReference;
      fee.approvalStatus = 'Pending';
    } else {
      return res.status(400).json({ message: 'Invalid payment mode' });
    }

    fee.markModified('payments');
    await fee.save();

    await fee.populate('student', 'studentNameEnglish studentId');
    await fee.populate('center', 'name bankDetails');
    await fee.populate('course', 'title');
    await fee.populate('batch', 'name');

    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve bank payment
router.patch('/:id/approve', protect, async (req, res) => {
  try {
    const { approvalStatus } = req.body; // 'Approved' or 'Rejected'
    const fee = await StudentFee.findById(req.params.id);
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (fee.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Fee is not pending approval' });
    }

    fee.approvalStatus = approvalStatus;

    if (!fee.payments) {
      fee.payments = [];
    }
    const pendingPayment = fee.payments.find(p => p.status === 'Pending');

    if (pendingPayment) {
      pendingPayment.status = approvalStatus === 'Approved' ? 'Approved' : 'Rejected';
      pendingPayment.paidAt = pendingPayment.paidAt || new Date();
      pendingPayment.approvedBy = req.user._id;
      pendingPayment.approvedAt = new Date();
      fee.markModified('payments');
    }

    if (approvalStatus === 'Approved') {
      const approvedAmount = pendingPayment ? pendingPayment.amount : fee.amount;
      
      if (fee.paymentMode === 'Cash') {
        const center = await Center.findById(fee.center);
        if (center) {
          center.cashBalance = (center.cashBalance || 0) + approvedAmount;
          await center.save();
        }
      }

      // Check if fully paid
      const totalApprovedPaid = fee.payments
        .filter(p => p.status === 'Approved')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalDue = fee.amount + 
        (fee.isPenaltyApplied ? fee.penaltyAmount : 0) + 
        (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0);

      if (totalApprovedPaid >= totalDue) {
        fee.status = 'paid';
        fee.paidAt = new Date();
      } else {
        fee.status = 'pending'; // revert to pending for next collections
      }
    } else if (approvalStatus === 'Rejected') {
      fee.status = 'pending';
    } else {
      return res.status(400).json({ message: 'Invalid approval status' });
    }

    await fee.save();

    await fee.populate('student', 'studentNameEnglish studentId');
    await fee.populate('center', 'name bankDetails');
    await fee.populate('course', 'title');
    await fee.populate('batch', 'name');

    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate receipt PDF
router.get('/:id/receipt', protect, async (req, res) => {
  try {
    const fee = await StudentFee.findById(req.params.id)
      .populate('student', 'studentNameEnglish studentId email phone year')
      .populate('center', 'name bankDetails')
      .populate('course', 'title')
      .populate('batch', 'name')
      .populate('payments.approvedBy', 'name');

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    const { generateReceiptPDF } = require('../utils/receiptGenerator');

    const { paymentId } = req.query;
    let paymentAmount = fee.amount;
    let paymentDate = fee.paidAt || fee.createdAt;
    let paymentMode = fee.paymentMode;
    let paymentReference = fee.bankReference || fee.proofOfPayment || (fee.paymentMode === 'Cash' ? 'CASH' : 'N/A');
    let paymentStatus = fee.status;
    let isPartialPayment = false;

    let feeDescription = `${fee.course?.title || 'Course'} - ${fee.feeType} Fee`;
    if (fee.feeType === 'Term' && fee.terms && fee.terms.length > 0) {
      feeDescription += ` (Term ${fee.terms.join(', ')})`;
    }

    if (paymentId && fee.payments && fee.payments.length > 0) {
      const p = fee.payments.id(paymentId) || fee.payments.find(x => x._id?.toString() === paymentId.toString());
      if (p) {
        paymentAmount = p.amount;
        paymentDate = p.paidAt || paymentDate;
        paymentMode = p.paymentMode || paymentMode;
        paymentReference = p.bankReference || p.proofOfPayment || (p.paymentMode === 'Cash' ? 'CASH' : 'N/A');
        paymentStatus = p.status;
        isPartialPayment = true;
      }
    }

    const items = [
      {
        description: isPartialPayment ? `${feeDescription} (Installment Payment)` : feeDescription,
        qty: 1,
        amount: paymentAmount
      }
    ];

    if (!isPartialPayment) {
      if (fee.isPenaltyApplied && fee.penaltyAmount > 0) {
        items.push({
          description: "Late Fee Penalty",
          qty: 1,
          amount: fee.penaltyAmount
        });
      }

      if (fee.isFinalPenaltyApplied && fee.finalPenaltyAmount > 0) {
        items.push({
          description: "Final Late Fee Penalty",
          qty: 1,
          amount: fee.finalPenaltyAmount
        });
      }
    }

    const totalDue = items.reduce((sum, item) => sum + item.amount, 0);

    const data = {
      documentTitle: "FEE RECEIPT",
      receiptNo: paymentId 
        ? `${fee._id.toString().substring(0, 4)}-${paymentId.toString().substring(0, 4)}`.toUpperCase() 
        : fee._id.toString().substring(0, 8).toUpperCase(),
      date: paymentDate,
      transactionId: paymentReference,
      billedTo: {
        name: fee.student?.studentNameEnglish || "Student",
        id: fee.student?.studentId || fee.student?._id?.toString().substring(0, 8).toUpperCase() || "",
        email: fee.student?.email || "",
        phone: fee.student?.phone || ""
      },
      issuedBy: {
        name: fee.center?.name || "DR Academy Center",
        addressLine1: fee.center?.bankDetails ? `Bank: ${fee.center.bankDetails}` : "",
        addressLine2: "",
        contact: ""
      },
      items,
      totalAmount: totalDue,
      status: paymentStatus
    };

    generateReceiptPDF(res, data);

  } catch (error) {
    console.error("Receipt generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate receipt" });
    }
  }
});

module.exports = router;
