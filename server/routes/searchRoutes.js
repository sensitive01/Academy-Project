const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Center = require('../models/Center');
const Vendor = require('../models/Vendor');

// @desc    Global Search
// @route   GET /api/search
// @access  Private (Admin / Sub-Admin)
router.get('/', protect, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ students: [], employees: [], courses: [], centers: [], vendors: [] });
    }

    // Role check to ensure only authorized personnel can access global search
    if (!['admin', 'sub-admin', 'hr', 'finance'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for global search' });
    }

    const regex = new RegExp(q, 'i');

    // 1. Search Users (Students, Employees, etc.)
    const userSearchQuery = {
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex },
        { customId: regex }
      ]
    };
    
    // We can select specific fields to avoid sending large payloads (like passwords)
    const users = await User.find(userSearchQuery).select('name email phone role customId createdAt').limit(20);

    const students = users.filter(u => u.role === 'student');
    const employees = users.filter(u => ['employee', 'hr', 'finance', 'admin', 'sub-admin', 'coach'].includes(u.role));
    
    // 2. Search Courses
    const courses = await Course.find({
      $or: [
        { title: regex },
        { description: regex }
      ]
    }).select('title category level fees').limit(10);

    // 3. Search Centers
    const centers = await Center.find({
      $or: [
        { name: regex },
        { 'location.city': regex },
        { 'location.state': regex },
        { 'contactInfo.email': regex }
      ]
    }).select('name location contactInfo').limit(10);

    // 4. Search Vendors
    const vendors = await Vendor.find({
      $or: [
        { companyName: regex },
        { contactPerson: regex },
        { email: regex }
      ]
    }).select('companyName contactPerson email mobile status').limit(10);

    res.json({
      students,
      employees,
      courses,
      centers,
      vendors
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
