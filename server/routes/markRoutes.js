const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/authMiddleware');
const { createInAppNotification } = require('../utils/notificationUtils');


const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

// GET all marks
router.get('/', protect, async (req, res) => {
  try {
    const marks = await Mark.find()
      .populate('student', 'studentNameEnglish studentId')
      .populate('course', 'title')
      .populate('batch', 'name')
      .populate('subject', 'name code type')
      .sort({ createdAt: -1 });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET marks for a specific student
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const marks = await Mark.find({ student: req.params.studentId })
      .populate('course', 'title')
      .populate('subject', 'name code type');
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create a new mark (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { student, semester, batch, course, subject, theoryMark, internalMark, practicalMark } = req.body;
    
    // Check if mark for this student, semester and subject already exists
    const existing = await Mark.findOne({ student, semester, subject });
    if (existing) {
      return res.status(400).json({ message: 'Mark for this student and subject already exists in this semester.' });
    }

    const markData = {
      student,
      semester: Number(semester),
      batch,
      course,
      subject,
      theoryMark: Number(theoryMark || 0),
      internalMark: Number(internalMark || 0),
      practicalMark: Number(practicalMark || 0)
    };



    const mark = await Mark.create(markData);
    
    // Notify student
    const studentDoc = await Student.findById(student).select('user');
    if (studentDoc && studentDoc.user) {
      await createInAppNotification({
        recipient: studentDoc.user,
        sender: req.user._id,
        type: "result_published",
        title: "New Results Published",
        message: `Your marks for the recent exam have been published.`,
        entityId: mark._id.toString()
      });
    }

    res.status(201).json(mark);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update a mark (Admin only)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { student, semester, batch, course, subject, theoryMark, internalMark, practicalMark } = req.body;
    const mark = await Mark.findById(req.params.id);
    
    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    if (student) mark.student = student;
    if (semester !== undefined) mark.semester = Number(semester);
    if (batch) mark.batch = batch;
    if (course) mark.course = course;
    if (subject) mark.subject = subject;
    if (theoryMark !== undefined) mark.theoryMark = Number(theoryMark);
    if (internalMark !== undefined) mark.internalMark = Number(internalMark);
    if (practicalMark !== undefined) mark.practicalMark = Number(practicalMark);



    await mark.save();

    // Notify student
    const studentDoc = await Student.findById(mark.student).select('user');
    if (studentDoc && studentDoc.user) {
      await createInAppNotification({
        recipient: studentDoc.user,
        sender: req.user._id,
        type: "result_published",
        title: "Results Updated",
        message: `Your marks for the recent exam have been updated.`,
        entityId: mark._id.toString()
      });
    }

    res.json(mark);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST bulk upload marks via JSON array (Admin only)
router.post('/bulk', protect, isAdmin, async (req, res) => {
  try {
    const { marks } = req.body; // Array of objects
    if (!marks || !Array.isArray(marks)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < marks.length; i++) {
      const row = marks[i];
      try {
        const studentDoc = await Student.findOne({ studentId: row['Student ID'] });
        const courseDoc = await Course.findOne({ title: row['Course Title'] });
        const subjectDoc = await Subject.findOne({ code: row['Subject Code'] });
        const semester = Number(row['Semester']);

        if (!studentDoc || !courseDoc || !subjectDoc || isNaN(semester)) {
          throw new Error(`Missing reference or invalid semester`);
        }

        const existing = await Mark.findOne({ student: studentDoc._id, semester, subject: subjectDoc._id });
        if (existing) {
          throw new Error('Mark already exists for this student, semester, and subject');
        }

        await Mark.create({
          student: studentDoc._id,
          semester,
          course: courseDoc._id,
          subject: subjectDoc._id,
          theoryMark: Number(row['Theory Mark'] || 0),
          internalMark: Number(row['Internal Mark'] || 0),
          practicalMark: Number(row['Practical Mark'] || 0)
        });
        results.success += 1;
      } catch (err) {
        results.failed += 1;
        results.errors.push(`Row ${i + 1} (${row['Student ID'] || 'Unknown'}): ${err.message}`);
      }
    }

    res.json({ message: 'Bulk upload completed', results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE a mark (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.id);
    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }
    await mark.deleteOne();
    res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
