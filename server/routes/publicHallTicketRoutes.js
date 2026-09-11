const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const HallTicket = require('../models/HallTicket');

// @route   POST /api/public-hallticket/verify
// @desc    Verify DOB and fetch hall ticket
router.post('/verify', async (req, res) => {
  try {
    const { studentId, dob } = req.body;

    if (!studentId || !dob) {
      return res.status(400).json({ message: 'Student ID and Date of Birth are required' });
    }

    const student = await Student.findOne({ studentId })
      .populate('enrolledCourses.course', 'title')
      .populate('enrolledCourses.batch', 'name numberOfSemesters')
      .populate('center');

    if (!student) {
      return res.status(404).json({ message: 'Student not found with this ID' });
    }

    if (!student.dob) {
      return res.status(400).json({ message: 'DOB not registered for this student. Contact administration.' });
    }

    const studentDob = new Date(student.dob);
    const day = String(studentDob.getDate()).padStart(2, '0');
    const month = String(studentDob.getMonth() + 1).padStart(2, '0');
    const year = studentDob.getFullYear();
    const formattedStoredDobDMY = `${day}-${month}-${year}`;
    const formattedStoredDobYMD = `${year}-${month}-${day}`;

    if (dob !== formattedStoredDobDMY && dob !== formattedStoredDobYMD) {
      return res.status(400).json({ message: 'Invalid Date of Birth' });
    }

    // Now find the hall ticket for this student
    const hallTickets = await HallTicket.find({ students: student._id })
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

    if (!hallTickets || hallTickets.length === 0) {
      return res.status(404).json({ message: 'No hall ticket generated for this student' });
    }

    const latestHallTicket = hallTickets[0];

    res.status(200).json({
      message: 'Verified successfully',
      student: student,
      hallTicket: latestHallTicket
    });
  } catch (error) {
    console.error('VERIFY & FETCH HALL TICKET ERROR:', error);
    res.status(500).json({ message: 'Verification or fetching hall ticket failed' });
  }
});

module.exports = router;
