const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const { protect } = require("../middleware/authMiddleware");

//////////////////////////////////////////////////////
// CREATE BATCH
//////////////////////////////////////////////////////
router.post("/", protect, async (req, res) => {
  try {
    const { name, batchId, course, center, numberOfSemesters, period, numberOfStudents, semesters, certificateDate } = req.body;

    const exists = await Batch.findOne({ $or: [{ name }, { batchId }] });
    if (exists) {
      return res.status(400).json({ message: "Batch name or ID already exists" });
    }

    const batch = await Batch.create({
      name,
      batchId,
      course,
      center,
      numberOfSemesters,
      period,
      numberOfStudents,
      semesters,
      certificateDate
    });

    await batch.populate("course");
    await batch.populate("center");
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
      .populate("course")
      .populate("center")
      .populate("semesters.subjects")
      .lean();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE BATCH
//////////////////////////////////////////////////////
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, batchId, course, center, numberOfSemesters, period, numberOfStudents, semesters, certificateDate } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (name) batch.name = name;
    if (batchId) batch.batchId = batchId;
    if (course) batch.course = course;
    if (center) batch.center = center;
    if (numberOfSemesters !== undefined) batch.numberOfSemesters = numberOfSemesters;
    if (period) batch.period = period;
    if (numberOfStudents !== undefined) batch.numberOfStudents = numberOfStudents;
    if (semesters) batch.semesters = semesters;
    if (certificateDate !== undefined) batch.certificateDate = certificateDate;

    await batch.save();

    await batch.populate("course");
    await batch.populate("center");
    await batch.populate("semesters.subjects");

    res.json(batch);
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

module.exports = router;
