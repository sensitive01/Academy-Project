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
      .populate('centers', 'name location')
      .populate('batch', 'name')
      .populate('subjects.subject', 'name code type semester')
      .sort({ createdAt: -1 });
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
      .populate('centers', 'name location')
      .populate('batch', 'name')
      .populate('subjects.subject', 'name code type semester');
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
    const { name, course, semester, centers, batch, subjects } = req.body;
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: "At least one subject is required" });
    }

    const exam = await Exam.create({
      name,
      course,
      semester,
      centers: centers || [],
      batch,
      subjects
    });

    // Notify enrolled students in the specific centers
    if (course && centers && centers.length > 0) {
      const enrolledStudents = await Student.find({ 
        "enrolledCourses.course": course, 
        center: { $in: centers } 
      }).select("user");
      
      for (const student of enrolledStudents) {
        if (student.user) {
          await createInAppNotification({
            recipient: student.user,
            sender: req.user._id,
            type: "exam_created",
            title: "New Exam Scheduled",
            message: `A new exam schedule "${name}" has been published.`,
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
    const { name, course, semester, centers, batch, subjects } = req.body;
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (name) exam.name = name;
    if (course) exam.course = course;
    if (semester) exam.semester = semester;
    if (centers) exam.centers = centers;
    if (batch) exam.batch = batch;
    if (subjects) exam.subjects = subjects;

    await exam.save();

    // Notify enrolled students in the specific centers
    if (exam.course && exam.centers && exam.centers.length > 0) {
      const enrolledStudents = await Student.find({ 
        "enrolledCourses.course": exam.course, 
        center: { $in: exam.centers } 
      }).select("user");
      
      for (const student of enrolledStudents) {
        if (student.user) {
          await createInAppNotification({
            recipient: student.user,
            sender: req.user._id,
            type: "exam_updated",
            title: "Exam Schedule Updated",
            message: `The details for the exam schedule "${exam.name}" have been updated.`,
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
