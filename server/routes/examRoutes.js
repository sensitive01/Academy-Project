const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const { protect } = require('../middleware/authMiddleware');
const { createInAppNotification } = require('../utils/notificationUtils');


const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

// GET all exams
router.get('/', protect, async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('course', 'title')
      .populate('center', 'name location')
      .populate('batch', 'name')
      .populate('subject', 'name code type semester')
      .sort({ date: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a single exam
router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('course', 'title')
      .populate('center', 'name location')
      .populate('batch', 'name')
      .populate('subject', 'name code type semester');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create a new exam (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { name, date, course, semester, center, batch, subject, totalMark, passMark, internalMark, externalMark, theoryMark } = req.body;
    const exam = await Exam.create({
      name,
      date,
      course,
      semester,
      center,
      batch,
      subject,
      totalMark: Number(totalMark || 100),
      passMark: Number(passMark || 35),
      internalMark: Number(internalMark || 0),
      externalMark: Number(externalMark || 0),
      theoryMark: Number(theoryMark || 0)
    });

    // Notify enrolled students in the specific center
    if (course && center) {
      const students = await Student.find({ "enrolledCourses.course": course, center: center }).select("user");
      for (const student of students) {
        if (student.user) {
          await createInAppNotification({
            recipient: student.user,
            sender: req.user._id,
            type: "exam_created",
            title: "New Exam Scheduled",
            message: `A new exam "${name}" has been scheduled for ${new Date(date).toLocaleDateString()}.`,
            entityId: exam._id.toString()
          });
        }
      }
    }

    res.status(201).json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update an exam (Admin only)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { name, date, course, semester, center, batch, subject, totalMark, passMark, internalMark, externalMark, theoryMark } = req.body;
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (name) exam.name = name;
    if (date) exam.date = date;
    if (course) exam.course = course;
    if (semester) exam.semester = semester;
    if (center) exam.center = center;
    if (batch) exam.batch = batch;
    if (subject) exam.subject = subject;
    if (totalMark !== undefined) exam.totalMark = Number(totalMark);
    if (passMark !== undefined) exam.passMark = Number(passMark);
    if (internalMark !== undefined) exam.internalMark = Number(internalMark);
    if (externalMark !== undefined) exam.externalMark = Number(externalMark);
    if (theoryMark !== undefined) exam.theoryMark = Number(theoryMark);

    await exam.save();

    // Notify enrolled students in the specific center
    if (exam.course && exam.center) {
      const students = await Student.find({ "enrolledCourses.course": exam.course, center: exam.center }).select("user");
      for (const student of students) {
        if (student.user) {
          await createInAppNotification({
            recipient: student.user,
            sender: req.user._id,
            type: "exam_updated",
            title: "Exam Updated",
            message: `The details for the exam "${exam.name}" have been updated.`,
            entityId: exam._id.toString()
          });
        }
      }
    }

    res.json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE an exam (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    await exam.deleteOne();
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
