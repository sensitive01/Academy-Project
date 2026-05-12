const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const { protect } = require("../middleware/authMiddleware");

// ==========================================
// CREATE VENDOR (Admin)
// ==========================================
router.post("/", protect, async (req, res) => {
  try {
    const { name, email, password, companyName, contactPerson, mobile, address, website } = req.body;

    const roleLower = "vendor";
    
    // allow only admin to create vendor? 
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can register a vendor" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const user = await User.create({
      name,
      email,
      password: password || "Vendor@123",
      role: roleLower,
    });

    const vendor = await Vendor.create({
      user: user._id,
      companyName,
      contactPerson,
      mobile,
      email,
      address,
      website
    });

    user.vendorProfile = vendor._id;
    await user.save();

    res.status(201).json({ message: "Vendor created successfully", vendor });
  } catch (err) {
    console.error("Error creating vendor:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// GET ALL VENDORS
// ==========================================
router.get("/", protect, async (req, res) => {
  try {
    const vendors = await Vendor.find().populate("user", "name email role");
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// VENDOR FETCHING THEIR ASSIGNED STUDENTS (INTERNS) + ATTENDANCE & LEAVES
// ==========================================
router.get("/my-interns", protect, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: "Only vendors can access this endpoint" });
    }

    const vendorProfile = await Vendor.findOne({ user: req.user._id });
    if (!vendorProfile) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const students = await Student.find({
      "internships.vendor": vendorProfile._id,
      "internships.status": "active"
    }).populate("user", "name email");

    const studentsData = await Promise.all(students.map(async (student) => {
        // Find the LATEST active internship detail for this vendor
        const internship = [...student.internships].reverse().find(
            i => i.vendor?.toString() === vendorProfile._id.toString() && i.status === 'active'
        );

        let attendance = [];
        let leaves = [];

        if (internship && internship.startDate && internship.endDate) {
            const rangeStart = new Date(internship.startDate);
            rangeStart.setHours(0, 0, 0, 0);
            
            const rangeEnd = new Date(internship.endDate);
            rangeEnd.setHours(23, 59, 59, 999);

            // Fetch attendance within the date range
            attendance = await Attendance.find({
                userId: student.user._id,
                date: { $gte: rangeStart, $lte: rangeEnd }
            });

            // Fetch leaves within the date range
            leaves = await Leave.find({
                userId: student.user._id,
                startDate: { $lte: rangeEnd },
                endDate: { $gte: rangeStart }
            });
        }

        return {
            studentId: student._id,
            name: student.studentNameEnglish,
            nameMotherTongue: student.studentNameMotherTongue,
            email: student.email,
            phone: student.phone,
            whatsapp: student.whatsapp,
            gender: student.gender,
            dob: student.dob,
            fatherName: student.fatherName,
            address: student.address,
            internshipDetails: internship,
            attendance,
            leaves
        };
    }));

    res.json(studentsData);
  } catch (err) {
    console.error("Error fetching vendor interns:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// UPDATE VENDOR (Admin)
// ==========================================
router.put("/:id", protect, async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    if (role !== 'admin' && role !== 'sub-admin') {
      return res.status(403).json({ message: "Only admin and sub-admin can update a vendor" });
    }

    const { name, email, companyName, contactPerson, mobile, address, website } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Update Vendor Details
    vendor.companyName = companyName || vendor.companyName;
    vendor.contactPerson = contactPerson || vendor.contactPerson;
    vendor.mobile = mobile || vendor.mobile;
    vendor.email = email || vendor.email;
    vendor.address = address || vendor.address;
    vendor.website = website || vendor.website;

    await vendor.save();

    // Update associated User
    const user = await User.findById(vendor.user);
    if (user) {
        user.name = name || user.name;
        user.email = email || user.email;
        await user.save();
    }

    res.json({ message: "Vendor updated successfully", vendor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// TOGGLE VENDOR STATUS (Admin)
// ==========================================
router.patch("/:id/status", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role?.toLowerCase();
    console.log(`[VENDOR_STATUS_TOGGLE] Request by: ${req.user.email} (Role: ${role}) for Vendor ID: ${id}`);

    if (role !== 'admin' && role !== 'sub-admin') {
      return res.status(403).json({ message: "Only admin and sub-admin can toggle vendor status" });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      console.error(`[VENDOR_STATUS_TOGGLE] Vendor not found: ${id}`);
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Ensure status exists
    if (!vendor.status) {
        vendor.status = "active";
    }

    const oldStatus = vendor.status;
    vendor.status = oldStatus === "active" ? "inactive" : "active";
    
    console.log(`[VENDOR_STATUS_TOGGLE] Changing status from ${oldStatus} to ${vendor.status}`);
    
    await vendor.save();

    res.json({ 
        success: true,
        message: `Vendor ${vendor.companyName} is now ${vendor.status}`, 
        status: vendor.status 
    });
  } catch (err) {
    console.error("[VENDOR_STATUS_TOGGLE] CRITICAL ERROR:", err);
    res.status(500).json({ message: "Internal server error while toggling status: " + err.message });
  }
});

// ==========================================
// DELETE VENDOR (Admin)
// ==========================================
router.delete("/:id", protect, async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    if (role !== 'admin' && role !== 'sub-admin') {
      return res.status(403).json({ message: "Only admin and sub-admin can delete a vendor" });
    }

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Remove user associated with vendor
    await User.findByIdAndDelete(vendor.user);
    
    // Remove vendor profile
    await Vendor.findByIdAndDelete(req.params.id);

    res.json({ message: "Vendor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
