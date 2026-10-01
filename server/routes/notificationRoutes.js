const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const Reminder = require("../models/Reminder");
const { protect } = require("../middleware/authMiddleware");
const { createInAppNotification } = require("../utils/notificationUtils");

// Get logged-in user's notifications
router.get("/", protect, async (req, res) => {
  try {
    const activeReminders = await Reminder.find({ 
      user: req.user._id, 
      status: "pending", 
      dueDate: { $exists: true }, 
      remindBeforeDays: { $gt: 0 } 
    });

    const today = new Date();
    today.setHours(0,0,0,0);

    for (const reminder of activeReminders) {
      const dDate = new Date(reminder.dueDate);
      const dDateNoTime = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate());
      
      const diffTime = dDateNoTime.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0 && diffDays <= reminder.remindBeforeDays) {
        const uniqueEntityId = `${reminder._id}-day-${diffDays}`;
        const existing = await Notification.findOne({ recipient: req.user._id, entityId: uniqueEntityId });

        if (!existing) {
          await createInAppNotification({
            recipient: req.user._id,
            type: "reminder",
            title: `Upcoming: ${reminder.title}`,
            message: `This event is due in ${diffDays} day(s) on ${dDateNoTime.toLocaleDateString()}.`,
            link: "/dashboard",
            entityId: uniqueEntityId
          });
        }
      } else if (diffDays === 0) {
        const uniqueEntityId = `${reminder._id}-today`;
        const existing = await Notification.findOne({ recipient: req.user._id, entityId: uniqueEntityId });

        if (!existing) {
          await createInAppNotification({
            recipient: req.user._id,
            type: "reminder",
            title: `Due Today: ${reminder.title}`,
            message: `This event is due today!`,
            link: "/dashboard",
            entityId: uniqueEntityId
          });
        }
      }
    }
  } catch (error) {
    console.error("Error generating reminder notifications:", error);
  }

  try {
    const query = { recipient: req.user._id };
    const { from, to, currentMonth } = req.query;

    if (currentMonth === 'true') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.createdAt = { $gte: startOfMonth };
    } else if (from || to) {
      query.createdAt = {};
      if (from) {
        query.createdAt.$gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error("Error generating/fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark one as read
router.patch("/:id/read", protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true,
  });

  res.json({ message: "Marked as read" });
});

// Mark all as read
router.patch("/mark-all", protect, async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ message: "All marked as read" });
});

// Delete notification
router.delete("/:id", protect, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;