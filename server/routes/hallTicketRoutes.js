const express = require('express');
const router = express.Router();
const HallTicket = require('../models/HallTicket');

// Get all hall tickets
router.get('/', async (req, res) => {
  try {
    const hallTickets = await HallTicket.find()
      .populate({
        path: 'exam',
        populate: [
          { path: 'course' },
          { path: 'batch' },
          { path: 'centers' },
          { path: 'subjects.subject' }
        ]
      })
      .populate({
        path: 'students',
        populate: [
          { path: 'enrolledCourses.course' }
        ]
      })
      .sort({ createdAt: -1 });
    res.json(hallTickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update a hall ticket batch
router.post('/', async (req, res) => {
  try {
    const { exam, students } = req.body;
    
    let hallTicket = await HallTicket.findOne({ exam });
    
    if (hallTicket) {
      // Add new students, avoiding duplicates
      const existingStudentIds = hallTicket.students.map(id => id.toString());
      const newStudentIds = students.filter(id => !existingStudentIds.includes(id.toString()));
      hallTicket.students.push(...newStudentIds);
      hallTicket.generatedAt = new Date(); // Update timestamp
      const savedHallTicket = await hallTicket.save();
      res.status(200).json(savedHallTicket);
    } else {
      hallTicket = new HallTicket({ exam, students });
      const savedHallTicket = await hallTicket.save();
      res.status(201).json(savedHallTicket);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a hall ticket batch
router.delete('/:id', async (req, res) => {
  try {
    const hallTicket = await HallTicket.findByIdAndDelete(req.params.id);
    if (!hallTicket) return res.status(404).json({ message: 'Hall Ticket not found' });
    res.json({ message: 'Hall Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

