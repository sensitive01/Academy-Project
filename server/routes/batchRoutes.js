const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const Student = require("../models/Student");
const { protect } = require("../middleware/authMiddleware");
const Mark = require("../models/Mark");

//////////////////////////////////////////////////////
// CREATE BATCH
//////////////////////////////////////////////////////
router.post("/", protect, async (req, res) => {
  try {
    const { name, batchId, courses, centers, numberOfSemesters, period, numberOfStudents, semesters, certificateDate } = req.body;

    const exists = await Batch.findOne({ centers: { $in: centers }, courses: { $in: courses }, $or: [{ name }, { batchId }] });
    if (exists) {
      return res.status(400).json({ message: "Batch name or ID already exists for one of the selected centers and course" });
    }

    const batch = await Batch.create({
      name,
      batchId,
      courses,
      centers,
      numberOfSemesters,
      period,
      numberOfStudents,
      semesters,
      certificateDate
    });

    await batch.populate("courses");
    await batch.populate("centers");
    await batch.populate("semesters.subjects");

    res.status(201).json(batch);
  } catch (err) {
    console.error("BATCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// GET ALL BATCHES
//////////////////////////////////////////////////////
router.get("/", protect, async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate("courses")
      .populate("centers")
      .populate("semesters.subjects")
      .lean();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// GET BATCH UPLOAD PROGRESS
//////////////////////////////////////////////////////
router.get("/progress", protect, async (req, res) => {
  try {
    const batches = await Batch.find().populate("courses").lean();
    
    const stats = await Promise.all(batches.map(async (batch) => {
      const onboardedStudents = await Student.find({ "enrolledCourses.batch": batch._id }).select('_id').lean();
      const onboardedStudentIds = onboardedStudents.map(s => s._id);
      
      const totalStudents = onboardedStudentIds.length;
      
      const uploadedMarks = await Mark.find({ 
        batch: batch._id,
        student: { $in: onboardedStudentIds }
      }).populate('exam', 'name').lean();
      
      const studentsWithMarks = [...new Set(uploadedMarks.map(m => m.student.toString()))];
      const uniqueExams = [...new Set(uploadedMarks.filter(m => m.exam).map(m => m.exam.name))];
      
      return {
        _id: batch._id,
        batchId: batch.batchId,
        name: batch.name,
        courseNames: batch.courses ? batch.courses.map(c => c.title).join(", ") : "",
        examNames: uniqueExams.length > 0 ? uniqueExams.join(", ") : "",
        totalStudents,
        uploadedCount: studentsWithMarks.length,
        remainingCount: totalStudents - studentsWithMarks.length
      };
    }));
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// GET BATCH PROGRESS STUDENTS
//////////////////////////////////////////////////////
router.get("/:id/progress-students", protect, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate("courses")
      .populate("centers")
      .lean();
      
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const onboardedStudents = await Student.find({ "enrolledCourses.batch": batch._id })
      .populate("center")
      .lean();
      
    const onboardedStudentIds = onboardedStudents.map(s => s._id);
    const uploadedMarks = await Mark.find({ 
      batch: batch._id,
      student: { $in: onboardedStudentIds }
    }).populate('exam', 'name').lean();
    
    const uploadedStudentIdsStr = [...new Set(uploadedMarks.map(m => m.student.toString()))];
    
    const uploadedStudents = [];
    const remainingStudents = [];
    
    for (const student of onboardedStudents) {
      const studentMarks = uploadedMarks.filter(m => m.student.toString() === student._id.toString());
      const examName = studentMarks.length > 0 && studentMarks[0].exam ? studentMarks[0].exam.name : null;

      // Create a mapped structure to send back clean data for datatable
      const mappedStudent = {
        _id: student._id,
        studentId: student.studentId,
        studentNameEnglish: student.studentNameEnglish,
        centerCode: student.center?.centerId || 'N/A',
        centerName: student.center?.name || 'N/A',
        examName: examName
      };
      
      if (uploadedStudentIdsStr.includes(student._id.toString())) {
        uploadedStudents.push(mappedStudent);
      } else {
        remainingStudents.push(mappedStudent);
      }
    }
    
    res.json({
      batch,
      totalStudents: onboardedStudents.map(s => {
        const studentMarks = uploadedMarks.filter(m => m.student.toString() === s._id.toString());
        const examName = studentMarks.length > 0 && studentMarks[0].exam ? studentMarks[0].exam.name : null;
        return {
          _id: s._id,
          studentId: s.studentId,
          studentNameEnglish: s.studentNameEnglish,
          centerCode: s.center?.centerId || 'N/A',
          centerName: s.center?.name || 'N/A',
          examName: examName
        };
      }),
      uploadedStudents,
      remainingStudents
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


//////////////////////////////////////////////////////
// UPDATE BATCH
//////////////////////////////////////////////////////
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, batchId, courses, centers, numberOfSemesters, period, numberOfStudents, semesters, certificateDate } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (name) batch.name = name;
    if (batchId) batch.batchId = batchId;
    if (courses) batch.courses = courses;
    if (centers) batch.centers = centers;
    if (numberOfSemesters !== undefined) batch.numberOfSemesters = numberOfSemesters;
    if (period) batch.period = period;
    if (numberOfStudents !== undefined) batch.numberOfStudents = numberOfStudents;
    if (semesters) batch.semesters = semesters;
    if (certificateDate !== undefined) batch.certificateDate = certificateDate;

    await batch.save();

    const populatedBatch = await Batch.findById(batch._id)
      .populate("courses")
      .populate("centers")
      .populate("semesters.subjects");

    res.json(populatedBatch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// DELETE BATCH
//////////////////////////////////////////////////////
router.delete("/:id", protect, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    await batch.deleteOne();

    res.json({ message: "Batch deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// ASSIGN STUDENTS TO BATCH
//////////////////////////////////////////////////////
router.post("/:id/assign-students", protect, async (req, res) => {
  try {
    const { studentIds } = req.body;
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    batch.students = studentIds;
    batch.numberOfStudents = studentIds.length;
    await batch.save();

    // 1. Find students who were removed from this batch and clear their batch field
    const removedStudents = await Student.find({ "enrolledCourses.batch": batch._id, _id: { $nin: studentIds } });
    for (const st of removedStudents) {
      st.enrolledCourses = st.enrolledCourses.map(ec => {
        if (ec.batch && ec.batch.toString() === batch._id.toString()) {
          ec.batch = null;
        }
        return ec;
      });
      await st.save();
    }

    // 2. Update or add enrolledCourses for newly assigned students
    for (const studentId of studentIds) {
      const student = await Student.findById(studentId);
      if (student) {
        let updated = false;
        student.enrolledCourses = student.enrolledCourses.map(ec => {
          if (ec.course && batch.courses.some(c => c.toString() === ec.course.toString())) {
            ec.batch = batch._id;
            updated = true;
          }
          return ec;
        });

        if (!updated && batch.courses && batch.courses.length > 0) {
          student.enrolledCourses.push({
            course: batch.courses[0],
            batch: batch._id,
            completed: false,
            progress: 0
          });
        }
        await student.save();
      }
    }

    await batch.populate("courses");
    await batch.populate("centers");
    await batch.populate("semesters.subjects");
    await batch.populate("students", "studentNameEnglish studentId");

    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
