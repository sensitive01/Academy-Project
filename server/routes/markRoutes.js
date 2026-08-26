const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Batch = require('../models/Batch');
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

// POST create marks for a student's entire semester (Admin only)
router.post('/bulk-student-semester', protect, isAdmin, async (req, res) => {
  try {
    const { student, batch, course, semester, subjects } = req.body;
    
    if (!student || !course || !semester || !Array.isArray(subjects)) {
      return res.status(400).json({ message: 'Missing required fields or invalid format' });
    }

    const createdMarks = [];

    for (const sub of subjects) {
      // Check if it already exists
      const existing = await Mark.findOne({ student, semester, subject: sub.subject });
      if (existing) {
        // Update existing mark
        existing.theoryMark = Number(sub.theoryMark || 0);
        existing.internalMark = Number(sub.internalMark || 0);
        existing.practicalMark = Number(sub.practicalMark || 0);
        await existing.save();
        createdMarks.push(existing);
      } else {
        // Create new mark
        const newMark = await Mark.create({
          student,
          batch,
          course,
          semester: Number(semester),
          subject: sub.subject,
          theoryMark: Number(sub.theoryMark || 0),
          internalMark: Number(sub.internalMark || 0),
          practicalMark: Number(sub.practicalMark || 0)
        });
        createdMarks.push(newMark);
      }
    }

    res.status(201).json(createdMarks);
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
        let batchDoc = null;
        if (row['Batch Name']) {
          batchDoc = await Batch.findOne({ name: row['Batch Name'] });
        }
        const semester = Number(row['Semester']);

        if (!studentDoc || !courseDoc || isNaN(semester)) {
          throw new Error(`Missing student, course, or invalid semester`);
        }

        let processedAny = false;

        const processSubject = async (codeKey, markKey, internalKey) => {
          if (!row[codeKey]) return false;
          let actualCode = String(row[codeKey]).split(' - ')[0].trim();
          
          const subjectDoc = await Subject.findOne({ code: actualCode });
          if (!subjectDoc) {
             results.failed += 1;
             results.errors.push(`Row ${i + 1}: Subject code ${actualCode} not found`);
             return true;
          }
          
          let theoryMark = 0;
          let practicalMark = 0;
          
          if (subjectDoc.type === "Practical") {
            practicalMark = Number(row[markKey] || 0);
          } else {
            theoryMark = Number(row[markKey] || 0);
          }
          
          const internalMark = Number(row[internalKey] || 0);

          const existing = await Mark.findOne({ student: studentDoc._id, semester, subject: subjectDoc._id });
          if (existing) {
            existing.theoryMark = theoryMark;
            existing.internalMark = internalMark;
            existing.practicalMark = practicalMark;
            if (batchDoc) existing.batch = batchDoc._id;
            await existing.save();
            results.success += 1;
          } else {
            await Mark.create({
              student: studentDoc._id,
              batch: batchDoc ? batchDoc._id : undefined,
              semester,
              course: courseDoc._id,
              subject: subjectDoc._id,
              theoryMark,
              internalMark,
              practicalMark
            });
            results.success += 1;
          }
          return true;
        };

        // Check for old format
        if (row['Subject Code']) {
           await processSubject('Subject Code', 'Mark', 'Internal Mark');
           processedAny = true;
        }

        // Check for new multiple-subject format (up to 20 subjects per row)
        for (let j = 1; j <= 20; j++) {
           const found = await processSubject(`Subject ${j} Code`, `Subject ${j} Mark`, `Subject ${j} Internal`);
           if (found) processedAny = true;
        }

        if (!processedAny) {
           throw new Error('No valid subjects provided in row');
        }

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
