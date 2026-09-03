const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const Course = require("../models/Course");
const { protect } = require("../middleware/authMiddleware");

//////////////////////////////////////////////////////
// CREATE SUBJECT
//////////////////////////////////////////////////////
router.post("/", protect, async (req, res) => {
  try {
    const { name, code, type, semester, courses } = req.body;

    const exists = await Subject.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } });
    
    if (exists) {
      return res.status(400).json({ message: "Subject with this code already exists" });
    }

    const subject = await Subject.create({ name, code, type, semester, courses });

    if (courses && courses.length > 0) {
      await Course.updateMany({ _id: { $in: courses } }, { $addToSet: { subjects: subject._id } });
    }

    await subject.populate("courses");

    res.status(201).json(subject);
  } catch (err) {
    console.error("SUBJECT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// GET ALL SUBJECTS
//////////////////////////////////////////////////////
router.get("/", protect, async (req, res) => {
  try {
    const subjects = await Subject.find().populate("courses").lean();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE SUBJECT
//////////////////////////////////////////////////////
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, code, type, semester, courses } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const oldCourses = subject.courses || [];
    
    const checkCode = code || subject.code;
    
    const exists = await Subject.findOne({
      _id: { $ne: subject._id },
      code: { $regex: new RegExp(`^${checkCode}$`, 'i') }
    });

    if (exists) {
      return res.status(400).json({ message: "Subject with this code already exists" });
    }

    if (name) subject.name = name;
    if (code) subject.code = code;
    if (type) subject.type = type;
    if (semester) subject.semester = semester;
    if (courses !== undefined) subject.courses = courses;

    await subject.save();

    if (courses !== undefined) {
      const oldCoursesStr = oldCourses.map(id => id.toString());
      const newCoursesStr = courses.map(id => id.toString());
      
      const addedCourses = courses.filter(c => !oldCoursesStr.includes(c.toString()));
      const removedCourses = oldCourses.filter(c => !newCoursesStr.includes(c.toString()));
      
      if (removedCourses.length > 0) {
        await Course.updateMany({ _id: { $in: removedCourses } }, { $pull: { subjects: subject._id } });
      }
      if (addedCourses.length > 0) {
        await Course.updateMany({ _id: { $in: addedCourses } }, { $addToSet: { subjects: subject._id } });
      }
    }
    
    await subject.populate("courses");

    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// DELETE SUBJECT
//////////////////////////////////////////////////////
router.delete("/:id", protect, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (subject.courses && subject.courses.length > 0) {
      await Course.updateMany({ _id: { $in: subject.courses } }, { $pull: { subjects: subject._id } });
    }

    await subject.deleteOne();

    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
