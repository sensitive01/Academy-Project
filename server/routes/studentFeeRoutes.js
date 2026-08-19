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
      .populate('student', 'studentNameEnglish studentId')
      .populate('center', 'name bankDetails')
      .populate('course', 'title')
      .populate('batch', 'name')
      .sort({ createdAt: -1 });
      
    // Dynamically apply penalties for pending fees
    const now = new Date();
    let updatedFees = false;

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
    const { studentId, feeType, paymentMode, proofOfPayment, bankReference, amount } = req.body;
    
    // Find all student fee records for this student that are not fully paid
    let feeRecords = await StudentFee.find({
      student: studentId,
      status: { $ne: 'paid' }
    });

    // Filter by feeType matching logic
    feeRecords = feeRecords.filter(f => {
      if (feeType === 'Council') return f.feeType === 'Council' || (f.feeType === 'Other' && f.otherFeeType === 'Council Fees');
      if (feeType === 'Course') return ['Sem', 'Term', 'Monthly'].includes(f.feeType);
      if (feeType === 'Other') return f.feeType === 'Other' && f.otherFeeType !== 'Council Fees';
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
      pendingPayment.paidAt = new Date();
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
      .populate('student', 'studentNameEnglish studentId email phone')
      .populate('center', 'name bankDetails')
      .populate('course', 'title')
      .populate('batch', 'name');

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
