const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const { protect } = require("../middleware/authMiddleware");

// GET Global Settings
router.get("/", protect, async (req, res) => {
  try {
    let settings = await Settings.findOne({ isSingleton: true });
    if (!settings) {
      settings = await Settings.create({ isSingleton: true });
    }
    res.status(200).json(settings);
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE Global Settings (Admin Only)
router.put("/", protect, async (req, res) => {
  try {
    // Basic authorization check - assuming only admins can hit this
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    let settings = await Settings.findOne({ isSingleton: true });
    if (!settings) {
      settings = new Settings({ isSingleton: true });
    }

    // Only update globalBankDetails for now
    if (req.body.globalBankDetails) {
      settings.globalBankDetails = req.body.globalBankDetails;
    }

    const updatedSettings = await settings.save();
    res.status(200).json(updatedSettings);
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
