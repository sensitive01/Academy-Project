const express = require("express");
const router = express.Router();
const Center = require("../models/Center");
const { protect } = require("../middleware/authMiddleware");

//////////////////////////////////////////////////////
// CREATE CENTER
//////////////////////////////////////////////////////
router.post("/", protect, async (req, res) => {
  try {
    const { name, location, description } = req.body;

    const exists = await Center.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Center already exists" });
    }

    const center = await Center.create({ name, location, description });

    res.status(201).json(center);
  } catch (err) {
    console.error("CENTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// GET ALL CENTERS
//////////////////////////////////////////////////////
router.get("/", async (req, res) => {
  try {
    const centers = await Center.find().lean();
    res.json(centers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE CENTER
//////////////////////////////////////////////////////
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, location, description } = req.body;

    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    if (name) center.name = name;
    if (location) center.location = location;
    if (description) center.description = description;

    await center.save();

    res.json(center);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// DELETE CENTER
//////////////////////////////////////////////////////
router.delete("/:id", protect, async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);

    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    await center.deleteOne();

    res.json({ message: "Center deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const User = require("../models/User");

//////////////////////////////////////////////////////
// GET CENTER LOGIN
//////////////////////////////////////////////////////
router.get("/:id/login", protect, async (req, res) => {
  try {
    const user = await User.findOne({ center: req.params.id, role: "center" }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// CREATE/UPDATE CENTER LOGIN
//////////////////////////////////////////////////////
router.post("/:id/login", protect, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const centerId = req.params.id;

    let user = await User.findOne({ center: centerId, role: "center" });

    if (user) {
      // Update existing login
      user.name = name || user.name;
      user.email = email || user.email;
      if (password) user.password = password;
      await user.save();
    } else {
      // Create new login
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }

      user = await User.create({
        name,
        email,
        password: password || "Center@123",
        role: "center",
        center: centerId,
      });
    }

    res.json({ message: "Center login saved successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;