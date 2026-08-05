const express = require('express');
const router = express.Router();
const StudentFee = require('../models/StudentFee');
const Center = require('../models/Center');
const { protect } = require('../middleware/authMiddleware');

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

    await fee.populate('student', 'studentNameEnglish studentId');
    await fee.populate('center', 'name bankDetails');
    await fee.populate('course', 'title');
    await fee.populate('batch', 'name');

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
    
    await fee.populate('student', 'studentNameEnglish studentId');
    await fee.populate('center', 'name bankDetails');
    await fee.populate('course', 'title');
    await fee.populate('batch', 'name');

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
      fee.status = 'paid';
      fee.paidAt = new Date();
      // Update Center Cash Balance
      const center = await Center.findById(fee.center);
      if (center) {
        center.cashBalance = (center.cashBalance || 0) + fee.amount + fee.penaltyAmount + fee.finalPenaltyAmount;
        await center.save();
      }
    } else if (paymentMode === 'Online') {
      fee.status = 'paid';
      fee.paidAt = new Date();
      fee.proofOfPayment = proofOfPayment;
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

module.exports = router;
