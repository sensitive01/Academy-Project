const express = require('express');
const router = express.Router();
const StudentFee = require('../models/StudentFee');
const { protect } = require('../middleware/authMiddleware');

// Get all student fees
router.get('/', protect, async (req, res) => {
  try {
    let fees = await StudentFee.find()
      .populate('student', 'studentNameEnglish studentId')
      .populate('center', 'name')
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
    await fee.populate('center', 'name');
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
    await fee.populate('center', 'name');
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

module.exports = router;
