const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

// Identify student or employee by ID
router.get("/identify/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let person = null;
        let role = "";

        if (id.startsWith("STU-")) {
            person = await Student.findOne({ studentId: id }).populate("user", "name email profilePic");
            role = "student";
        } else if (id.startsWith("EMP-")) {
            person = await Employee.findOne({ employeeId: id }).populate("user", "name email profilePic");
            role = "employee";
        }

        if (!person) {
            return res.status(404).json({ message: "Person not found with the provided ID" });
        }

        res.json({
            userId: person.user._id,
            name: person.user.name,
            role: role,
            photo: person.profilePic?.url || person.user.profilePic || null,
            email: person.user.email
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark attendance
router.post("/mark", async (req, res) => {
    try {
        const { userId, name, role, loginTime, photo, location, date } = req.body;

        let d = new Date();
        if (date) {
            d = new Date(date);
        }
        d.setHours(0, 0, 0, 0);
        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);

        const existing = await Attendance.findOne({
            userId,
            date: { $gte: d, $lt: nextDay },
        });

        if (existing) {
            return res.status(400).json({
                message: "Attendance already marked for this date.",
            });
        }

        const attendance = await Attendance.create({
            userId,
            name,
            role,
            date: d,
            loginTime,
            photo,
            location
        });

        res.status(201).json({ message: "Attendance marked successfully!", attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
