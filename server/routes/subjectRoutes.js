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
    const { name, code, type, semester, course } = req.body;

    const exists = await Subject.findOne({ $or: [{ name }, { code }] });
    if (exists) {
      return res.status(400).json({ message: "Subject with this name or code already exists" });
    }

    const subject = await Subject.create({ name, code, type, semester, course });

    if (course) {
      await Course.findByIdAndUpdate(course, { $addToSet: { subjects: subject._id } });
    }

    await subject.populate("course");

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
    const subjects = await Subject.find().populate("course").lean();
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
    const { name, code, type, semester, course } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const oldCourseId = subject.course;

    if (name) subject.name = name;
    if (code) subject.code = code;
    if (type) subject.type = type;
    if (semester) subject.semester = semester;
    if (course !== undefined) subject.course = course;

    await subject.save();

    if (course !== undefined && String(course) !== String(oldCourseId)) {
      if (oldCourseId) {
        await Course.findByIdAndUpdate(oldCourseId, { $pull: { subjects: subject._id } });
      }
      if (course) {
        await Course.findByIdAndUpdate(course, { $addToSet: { subjects: subject._id } });
      }
    }
    
    await subject.populate("course");

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

    if (subject.course) {
      await Course.findByIdAndUpdate(subject.course, { $pull: { subjects: subject._id } });
    }

    await subject.deleteOne();

    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
