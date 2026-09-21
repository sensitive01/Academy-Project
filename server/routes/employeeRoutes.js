const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const Employee = require("../models/Employee");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const Center = require("../models/Center");
const Otp = require("../models/Otp");

//////////////////////////////////////////////////////
// CREATE EMPLOYEE
//////////////////////////////////////////////////////
router.post(
  "/",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "idFile", maxCount: 1 },
    { name: "certificateFile", maxCount: 1 },
    { name: "contractFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        otp,
        phone,
        dob,
        gender,
        employeeId,
        joiningDate,
        department,
        designation,
        role,
        employmentType,
        salary,
        shiftStart,
        shiftEnd,
        center,
        privilegedLeave,
        sickLeave,
        casualLeave,
      } = req.body;

      //////////////////////////////////////////////////////
      // ROLE VALIDATION
      //////////////////////////////////////////////////////
      const roleLower = role ? role.toLowerCase() : "employee";

      const allowedRoles = [
        "student",
        "admin",
        "sub-admin",
        "employee",
        "parent",
        "coach",
        "hr",
        "finance",
      ];

      if (!allowedRoles.includes(roleLower)) {
        return res.status(400).json({ message: "Invalid role selected" });
      }

      //////////////////////////////////////////////////////
      // CHECK USER EXIST
      //////////////////////////////////////////////////////
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      if (center && center !== "") {
        const centerExists = await Center.findById(center);
        if (!centerExists) {
          return res.status(400).json({ message: "Invalid center" });
        }
      }

      //////////////////////////////////////////////////////
      // OTP VERIFICATION
      //////////////////////////////////////////////////////
      const otpRecord = await Otp.findOne({ email, otp });
      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      // Delete OTP after verification
      await Otp.deleteOne({ _id: otpRecord._id });

      //////////////////////////////////////////////////////
      // CREATE USER
      //////////////////////////////////////////////////////
      const user = await User.create({
        name: `${firstName} ${lastName}`,
        email,
        password: "Employee@123",
        role: roleLower,
        subjects: req.body.subjects ? JSON.parse(req.body.subjects) : [],
      });

      //////////////////////////////////////////////////////
      // CREATE EMPLOYEE
      //////////////////////////////////////////////////////
      const employee = await Employee.create({
        user: user._id,
        firstName,
        lastName,
        phone,
        dob,
        gender,
        employeeId,
        joiningDate,
        department,
        designation,
        employmentType,
        center: (req.user.role === 'center' || req.user.role === 'hr') ? req.user.center : (center || null),
        leaveBalances: {
          privilegedLeave: Number(privilegedLeave) || 0,
          sickLeave: Number(sickLeave) || 0,
          casualLeave: Number(casualLeave) || 0,
        },

        salary:
          salary !== undefined && salary !== ""
            ? Number(salary)
            : undefined,

        // SHIFT OBJECT
        shift: {
          start: shiftStart,
          end: shiftEnd,
        },

        profilePic: req.files?.profilePic
          ? {
            url: req.files.profilePic[0].path,
            public_id: req.files.profilePic[0].filename,
            name: req.files.profilePic[0].originalname,
          }
          : null,

        idFile: req.files?.idFile
          ? {
            url: req.files.idFile[0].path,
            public_id: req.files.idFile[0].filename,
            name: req.files.idFile[0].originalname,
          }
          : null,

        certificateFile: req.files?.certificateFile
          ? {
            url: req.files.certificateFile[0].path,
            public_id: req.files.certificateFile[0].filename,
            name: req.files.certificateFile[0].originalname,
          }
          : null,

        contractFile: req.files?.contractFile
          ? {
            url: req.files.contractFile[0].path,
            public_id: req.files.contractFile[0].filename,
            name: req.files.contractFile[0].originalname,
          }
          : null,
      });

      user.employeeProfile = employee._id;
      await user.save();

      res.status(201).json({
        message: "Employee created successfully",
        employee,
      });
    } catch (err) {
      console.error("Error creating employee:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

//////////////////////////////////////////////////////
// GET ALL EMPLOYEES
//////////////////////////////////////////////////////
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "center") {
      query.center = req.user.center;
    }
    const employees = await Employee.find(query)
      .populate("user", "name email role")
      .populate("center", "name location");

    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// //////////////////////////////////////////////////////
// // GET EMPLOYEE BY USER ID
// //////////////////////////////////////////////////////
router.get("/user/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.params.id })
      .populate("user", "name email role")
      .populate("center", "name location");

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// DELETE EMPLOYEE
//////////////////////////////////////////////////////
router.delete("/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await User.findByIdAndDelete(employee.user);
    await employee.deleteOne();

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////////
// UPDATE EMPLOYEE
//////////////////////////////////////////////////////
router.put(
  "/:id",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "idFile", maxCount: 1 },
    { name: "certificateFile", maxCount: 1 },
    { name: "contractFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const employee = await Employee.findById(req.params.id);

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        dob,
        gender,
        employeeId,
        joiningDate,
        department,
        designation,
        role,
        employmentType,
        salary,
        shiftStart,
        shiftEnd,
        center,
        privilegedLeave,
        sickLeave,
        casualLeave,
      } = req.body;

      //////////////////////////////////////////////////////
      // UPDATE USER
      //////////////////////////////////////////////////////
      const user = await User.findById(employee.user);

      if (!user) {
        return res.status(404).json({ message: "Associated user not found" });
      }

      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ message: "Email already exists" });
        }
        user.email = email;
      }

      if (firstName || lastName) {
        user.name = `${firstName || employee.firstName} ${lastName || employee.lastName
          }`;
      }

      if (center !== undefined) {
        if (center === "") {
          employee.center = null; // allow removing center
        } else {
          const centerExists = await Center.findById(center);
          if (!centerExists) {
            return res.status(400).json({ message: "Invalid center" });
          }
          employee.center = center;
        }
      }

      // ROLE UPDATE
      if (role) {
        const roleLower = role.toLowerCase();

        const allowedRoles = [
          "student",
          "admin",
          "sub-admin",
          "employee",
          "parent",
          "coach",
          "hr",
          "finance",
        ];

        if (!allowedRoles.includes(roleLower)) {
          return res.status(400).json({ message: "Invalid role selected" });
        }

        user.role = roleLower;
      }

      if (req.body.subjects) {
        user.subjects = JSON.parse(req.body.subjects);
      }

      await user.save();

      //////////////////////////////////////////////////////
      // UPDATE EMPLOYEE DATA
      //////////////////////////////////////////////////////
      if (firstName) employee.firstName = firstName;
      if (lastName) employee.lastName = lastName;
      if (phone) employee.phone = phone;
      if (dob) employee.dob = dob;
      if (gender) employee.gender = gender;
      if (employeeId) employee.employeeId = employeeId;
      if (joiningDate) employee.joiningDate = joiningDate;
      if (department) employee.department = department;
      if (designation) employee.designation = designation;
      if (employmentType) employee.employmentType = employmentType;

      //////////////////////////////////////////////////////
      // SHIFT UPDATE
      //////////////////////////////////////////////////////
      if (shiftStart !== undefined || shiftEnd !== undefined) {
        if (!employee.shift) {
          employee.shift = {};
        }

        if (shiftStart !== undefined) employee.shift.start = shiftStart;
        if (shiftEnd !== undefined) employee.shift.end = shiftEnd;
      }

      if (!employee.leaveBalances) {
        employee.leaveBalances = { privilegedLeave: 0, sickLeave: 0, casualLeave: 0 };
      }
      if (privilegedLeave !== undefined) employee.leaveBalances.privilegedLeave = Number(privilegedLeave) || 0;
      if (sickLeave !== undefined) employee.leaveBalances.sickLeave = Number(sickLeave) || 0;
      if (casualLeave !== undefined) employee.leaveBalances.casualLeave = Number(casualLeave) || 0;

      //////////////////////////////////////////////////////
      // SALARY UPDATE
      //////////////////////////////////////////////////////
      if (salary !== undefined) {
        const parsedSalary = Number(salary);

        if (isNaN(parsedSalary) || parsedSalary < 0) {
          return res.status(400).json({ message: "Invalid salary value" });
        }

        employee.salary = parsedSalary;
      }

      //////////////////////////////////////////////////////
      // FILE UPDATE
      //////////////////////////////////////////////////////
      if (req.files) {
        if (req.files.profilePic) {
          const profilePicData = {
            url: req.files.profilePic[0].path,
            public_id: req.files.profilePic[0].filename,
            name: req.files.profilePic[0].originalname,
          };
          employee.profilePic = profilePicData;

          // Sync with User model
          await User.findByIdAndUpdate(employee.user, {
            profilePic: profilePicData
          });
        }

        if (req.files.idFile)
          employee.idFile = {
            url: req.files.idFile[0].path,
            public_id: req.files.idFile[0].filename,
            name: req.files.idFile[0].originalname,
          };

        if (req.files.certificateFile)
          employee.certificateFile = {
            url: req.files.certificateFile[0].path,
            public_id: req.files.certificateFile[0].filename,
            name: req.files.certificateFile[0].originalname,
          };

        if (req.files.contractFile)
          employee.contractFile = {
            url: req.files.contractFile[0].path,
            public_id: req.files.contractFile[0].filename,
            name: req.files.contractFile[0].originalname,
          };
      }

      await employee.save();

      res.json({
        message: "Employee updated successfully",
        employee,
      });
    } catch (err) {
      console.error("Error updating employee:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

//////////////////////////////////////////////////////
// UPDATE EMPLOYEE STATUS
//////////////////////////////////////////////////////
router.patch("/:id/status", protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const newStatus = employee.status === "active" ? "inactive" : "active";
    await Employee.updateOne({ _id: employee._id }, { $set: { status: newStatus } });
    employee.status = newStatus;

    res.json({
      message: `Employee ${employee.status === "active" ? "unblocked" : "blocked"} successfully`,
      status: employee.status,
    });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;