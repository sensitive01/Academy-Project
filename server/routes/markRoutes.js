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

// Helper to validate mark limits against Exam configuration
const validateMarkLimits = async (courseId, semester, batchId, subjectId, theoryMark, internalMark, practicalMark) => {
  const examQuery = { course: courseId, semester };
  if (batchId) examQuery.batch = batchId;
  
  const exam = await Exam.findOne(examQuery).sort({ createdAt: -1 }).lean();
  if (!exam || !exam.subjects) return null; // No limit checks if exam doesn't exist
  
  const examSubject = exam.subjects.find(s => s.subject.toString() === subjectId.toString());
  if (!examSubject) return null; // Subject not in exam
  
  const errors = [];
  if (internalMark > examSubject.internalMark) {
    errors.push(`Internal mark (${internalMark}) exceeds maximum allowed (${examSubject.internalMark})`);
  }
  
  // External mark is compared against theoryMark or practicalMark depending on subject type
  // Since we don't have subject type here, we just check whichever one is provided > 0 against externalMark
  const providedExternal = Math.max(theoryMark || 0, practicalMark || 0);
  const maxExternal = examSubject.externalMark || examSubject.theoryMark || 0;
  if (maxExternal > 0 && providedExternal > maxExternal) {
    errors.push(`External mark (${providedExternal}) exceeds maximum allowed (${maxExternal})`);
  }
  
  if (errors.length > 0) return errors.join(', ');
  return null;
};

// GET all marks
router.get('/', protect, async (req, res) => {
  try {
    let marks = await Mark.find()
      .populate({ path: 'student', select: 'studentNameEnglish studentId center year dob', populate: { path: 'center', select: 'name centerId' } })
      .populate('course', 'title')
      .populate('batch', 'name')
      .populate('subject', 'name code type')
      .populate({ path: 'exam', select: 'name date subjects' })
      .lean()
      .sort({ createdAt: -1 });

    const exams = await Exam.find().sort({ createdAt: -1 }).lean();

    marks = marks.map(mark => {
      let passMark = 40; // fallback default
      if (mark.course && mark.subject) {
        const exam = exams.find(e => 
          e.course.toString() === mark.course._id.toString() &&
          e.semester === mark.semester &&
          (!e.batch || !mark.batch || e.batch.toString() === mark.batch._id.toString())
        );
        if (exam && exam.subjects) {
          const examSub = exam.subjects.find(s => s.subject.toString() === mark.subject._id.toString());
          if (examSub && examSub.passMark !== undefined) {
            passMark = examSub.passMark;
          }
        }
      }
      // Calculate isPass dynamically here as well
      const obtained = mark.subject?.type === "Practical" ? (mark.practicalMark || 0) : ((mark.theoryMark || 0) + (mark.internalMark || 0));
      const isPass = obtained >= passMark;
      
      return { ...mark, passMark, isPass };
    });

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET marks for a specific student
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    let marks = await Mark.find({ student: req.params.studentId })
      .populate('course', 'title')
      .populate('subject', 'name code type')
      .populate({ path: 'exam', select: 'name date subjects' })
      .lean();

    const exams = await Exam.find().sort({ createdAt: -1 }).lean();

    marks = marks.map(mark => {
      let passMark = 40; // fallback default
      if (mark.course && mark.subject) {
        const exam = exams.find(e => 
          e.course.toString() === mark.course._id.toString() &&
          e.semester === mark.semester &&
          (!e.batch || !mark.batch || e.batch.toString() === mark.batch.toString())
        );
        if (exam && exam.subjects) {
          const examSub = exam.subjects.find(s => s.subject.toString() === mark.subject._id.toString());
          if (examSub && examSub.passMark !== undefined) {
            passMark = examSub.passMark;
          }
        }
      }
      const obtained = mark.subject?.type === "Practical" ? (mark.practicalMark || 0) : ((mark.theoryMark || 0) + (mark.internalMark || 0));
      const isPass = obtained >= passMark;
      
      return { ...mark, passMark, isPass };
    });

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create marks for a student's entire semester (Admin only)
router.post('/bulk-student-semester', protect, isAdmin, async (req, res) => {
  try {
    const { student, batch, course, semester, subjects, template, exam } = req.body;
    
    if (!student || !course || !semester || !Array.isArray(subjects)) {
      return res.status(400).json({ message: 'Missing required fields or invalid format' });
    }

    const createdMarks = [];

    for (const sub of subjects) {
      const validationError = await validateMarkLimits(course, semester, batch, sub.subject, Number(sub.theoryMark || 0), Number(sub.internalMark || 0), Number(sub.practicalMark || 0));
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      // Check if it already exists
      const existing = await Mark.findOne({ student, semester, subject: sub.subject });
      if (existing) {
        // Update existing mark
        existing.theoryMark = Number(sub.theoryMark || 0);
        existing.internalMark = Number(sub.internalMark || 0);
        existing.practicalMark = Number(sub.practicalMark || 0);
        if (template) existing.template = template;
        if (exam) existing.exam = exam;
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
          practicalMark: Number(sub.practicalMark || 0),
          template: template || 'rg_modern',
          exam: exam || null
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
    const { student, semester, batch, course, exam, subject, theoryMark, internalMark, practicalMark, template } = req.body;
    
    // Check if mark for this student, semester and subject already exists
    const existing = await Mark.findOne({ student, semester, subject });
    if (existing) {
      return res.status(400).json({ message: 'Mark for this student and subject already exists in this semester.' });
    }

    // Validate limits
    const validationError = await validateMarkLimits(course, Number(semester), batch, subject, Number(theoryMark || 0), Number(internalMark || 0), Number(practicalMark || 0));
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const markData = {
      student,
      semester: Number(semester),
      batch,
      course,
      exam: exam || null,
      subject,
      theoryMark: Number(theoryMark || 0),
      internalMark: Number(internalMark || 0),
      practicalMark: Number(practicalMark || 0),
      template: template || 'rg_modern'
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
    const { student, semester, batch, course, exam, subject, theoryMark, internalMark, practicalMark, template } = req.body;
    const mark = await Mark.findById(req.params.id);
    
    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    // Validate limits
    const validationError = await validateMarkLimits(
      course || mark.course,
      semester !== undefined ? Number(semester) : mark.semester,
      batch || mark.batch,
      subject || mark.subject,
      theoryMark !== undefined ? Number(theoryMark) : mark.theoryMark,
      internalMark !== undefined ? Number(internalMark) : mark.internalMark,
      practicalMark !== undefined ? Number(practicalMark) : mark.practicalMark
    );
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (student) mark.student = student;
    if (semester !== undefined) mark.semester = Number(semester);
    if (batch) mark.batch = batch;
    if (course) mark.course = course;
    if (exam) mark.exam = exam;
    if (subject) mark.subject = subject;
    if (theoryMark !== undefined) mark.theoryMark = Number(theoryMark);
    if (internalMark !== undefined) mark.internalMark = Number(internalMark);
    if (practicalMark !== undefined) mark.practicalMark = Number(practicalMark);
    if (template !== undefined) mark.template = template;



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
    const { marks, template, examId } = req.body; // Array of objects, template, and optional examId
    if (!marks || !Array.isArray(marks)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    let examDoc = null;
    if (examId) {
      examDoc = await Exam.findById(examId);
      if (!examDoc) {
        return res.status(400).json({ message: 'Selected Exam not found in database.' });
      }
    }

    for (let i = 0; i < marks.length; i++) {
      const row = marks[i];
      try {
        const studentDoc = await Student.findOne({ studentId: row['Student ID'] });
        
        let courseDoc = null;
        let batchDoc = null;
        let semester;

        if (examDoc) {
          // Strictly use Exam definitions
          courseDoc = await Course.findById(examDoc.course);
          if (examDoc.batch) {
            batchDoc = await Batch.findById(examDoc.batch);
          }
          semester = examDoc.semester;
        } else {
          // Legacy string matching fallback
          let actualCourseTitle = row['Course Title'];
          if (actualCourseTitle && String(actualCourseTitle).includes(' - ')) {
            const parts = String(actualCourseTitle).split(' - ');
            actualCourseTitle = parts.slice(1).join(' - ').trim();
          }
          courseDoc = await Course.findOne({ title: actualCourseTitle });
          if (row['Batch Name']) {
            batchDoc = await Batch.findOne({ name: row['Batch Name'] });
          }
          semester = Number(row['Semester']);
        }

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

          const validationError = await validateMarkLimits(courseDoc._id, semester, batchDoc ? batchDoc._id : null, subjectDoc._id, theoryMark, internalMark, practicalMark);
          if (validationError) {
            results.failed += 1;
            results.errors.push(`Row ${i + 1} (${actualCode}): ${validationError}`);
            return true;
          }

          const existing = await Mark.findOne({ student: studentDoc._id, semester, subject: subjectDoc._id });
          if (existing) {
            existing.theoryMark = theoryMark;
            existing.internalMark = internalMark;
            existing.practicalMark = practicalMark;
            if (template) existing.template = template;
            if (batchDoc) existing.batch = batchDoc._id;
            if (examDoc) existing.exam = examDoc._id;
            await existing.save();
            results.success += 1;
          } else {
            const newMarkData = {
              student: studentDoc._id,
              batch: batchDoc ? batchDoc._id : undefined,
              semester,
              course: courseDoc._id,
              subject: subjectDoc._id,
              theoryMark,
              internalMark,
              practicalMark,
              template: template || 'rg_modern'
            };
            if (examDoc) newMarkData.exam = examDoc._id;
            await Mark.create(newMarkData);
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
