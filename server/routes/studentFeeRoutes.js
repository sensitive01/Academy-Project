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

// Collect student fee
router.post('/:id/collect', protect, async (req, res) => {
  try {
    const { paymentMode, proofOfPayment, bankReference } = req.body;
    const fee = await StudentFee.findById(req.params.id);
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (fee.status === 'paid') {
      return res.status(400).json({ message: 'Fee is already paid' });
    }

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

    if (approvalStatus === 'Approved') {
      fee.status = 'paid';
      fee.paidAt = new Date();
      if (fee.paymentMode === 'Cash') {
        const center = await Center.findById(fee.center);
        if (center) {
          center.cashBalance = (center.cashBalance || 0) + fee.amount + fee.penaltyAmount + fee.finalPenaltyAmount;
          await center.save();
        }
      }
    } else if (approvalStatus === 'Rejected') {
      fee.status = 'pending';
      // Reset payment details so they can try again if needed, or leave it for history
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

    const totalDue = fee.amount + 
      (fee.isPenaltyApplied ? fee.penaltyAmount : 0) + 
      (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0);

    let feeDescription = `${fee.course?.title || 'Course'} - ${fee.feeType} Fee`;
    if (fee.feeType === 'Term' && fee.terms && fee.terms.length > 0) {
      feeDescription += ` (Term ${fee.terms.join(', ')})`;
    }
    
    const items = [
      {
        description: feeDescription,
        qty: 1,
        amount: fee.amount
      }
    ];

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

    const data = {
      documentTitle: "FEE RECEIPT",
      receiptNo: fee._id.toString().substring(0, 8).toUpperCase(),
      date: fee.paidAt || fee.createdAt,
      transactionId: fee.bankReference || fee.proofOfPayment || (fee.paymentMode === 'Cash' ? 'CASH' : 'N/A'),
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
      status: fee.status
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
