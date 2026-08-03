const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/authMiddleware');

// All reminder routes require authentication
router.use(protect);

// @desc    Get all reminders for logged in user
// @route   GET /api/reminders
// @access  Private
router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id })
      .populate('assignedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Create a reminder
// @route   POST /api/reminders
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      description,
      dueDate
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Assign a reminder to another user
// @route   POST /api/reminders/assign
// @access  Private (Admins/Sub-Admins/HR/Finance)
router.post('/assign', async (req, res) => {
  try {
    // Check role authorization
    const allowedRoles = ['admin', 'sub-admin', 'hr', 'finance'];
    if (!allowedRoles.includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ message: 'Not authorized to assign reminders' });
    }

    const { targetUserId, title, description, dueDate, type } = req.body;

    if (!targetUserId || !title) {
      return res.status(400).json({ message: 'Target user and title are required' });
    }

    const reminder = await Reminder.create({
      user: targetUserId, // Who receives the reminder
      assignedBy: req.user._id, // Who sent it
      type: type || 'admin_notice',
      title,
      description,
      dueDate
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error assigning reminder:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check ownership
    if (reminder.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this reminder' });
    }

    const updatedReminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedReminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check ownership
    if (reminder.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this reminder' });
    }

    // Prevent deletion of assigned reminders unless completed
    if (reminder.assignedBy && reminder.status !== 'completed') {
      return res.status(403).json({ message: 'Cannot delete an assigned reminder until it is completed' });
    }

    await reminder.deleteOne();
    res.json({ message: 'Reminder removed' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
