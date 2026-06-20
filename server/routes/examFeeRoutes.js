const express = require('express');
const router = express.Router();
const ExamFee = require('../models/ExamFee');
const { protect } = require('../middleware/authMiddleware');

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// GET all exam fees
router.get('/', protect, async (req, res) => {
  try {
    const examFees = await ExamFee.find()
      .populate('center', 'name location')
      .populate('course', 'title category')
      .populate('batch', 'name type');
    res.json(examFees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create exam fee
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { center, course, batch, fee } = req.body;
    
    // Check if already exists
    const exists = await ExamFee.findOne({ center, course, batch });
    if (exists) {
      return res.status(400).json({ message: 'Exam fee configuration for this center, course, and batch already exists.' });
    }

    const examFee = await ExamFee.create({ center, course, batch, fee });
    res.status(201).json(examFee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update exam fee
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { center, course, batch, fee } = req.body;
    const examFee = await ExamFee.findById(req.params.id);
    
    if (!examFee) {
      return res.status(404).json({ message: 'Exam fee not found' });
    }

    if (center) examFee.center = center;
    if (course) examFee.course = course;
    if (batch) examFee.batch = batch;
    if (fee !== undefined) examFee.fee = fee;

    await examFee.save();
    res.json(examFee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE exam fee
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const examFee = await ExamFee.findByIdAndDelete(req.params.id);
    if (!examFee) {
      return res.status(404).json({ message: 'Exam fee not found' });
    }
    res.json({ message: 'Exam fee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
