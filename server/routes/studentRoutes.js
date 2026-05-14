const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const Student = require('../models/Student');
const User = require('../models/User');
const Course = require('../models/Course');
const Vendor = require('../models/Vendor');

// // ======================================================
// // CREATE STUDENT (Creates User + Student)
// // ======================================================
// ======================================================
// PUBLIC REGISTRATION (Apply Now)
// ======================================================
const { protect, optionalProtect } = require("../middleware/authMiddleware");
router.post('/public-registration', optionalProtect, async (req, res) => {
  try {
    const {
      studentNameEnglish,
      studentNameMotherTongue,
      email,
      phone,
      whatsapp,
      dob,
      age,
      fatherName,
      gender,
      aadharNo,
      religion,
      community,
      maritalStatus,
      center,
      nationality,
      
      // Educational identifiers
      kcetRegNo,
      neetRegNo,
      apaarId,
      debId,
      abcId,

      // Address
      address,
      village,
      post,
      taluk,
      district,
      pin,

      // Language & Bank
      englishFluency,
      language1,
      language2,
      language3,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankNameBranch,

      // Tables
      educationBackground,
      sslcSubjects,
      sslcDetails,
      hscSubjects,
      hscDetails,
      familyBackground,
      references,

      // App specific
      year,
      department,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const defaultPassword = "Student@123";

    // 1️⃣ Create User
    const user = await User.create({
      name: studentNameEnglish,
      email,
      password: defaultPassword,
      role: 'student',
      mobile: phone
    });

    // 2️⃣ Create Student Profile
    const student = await Student.create({
      user: user._id,
      studentId: `APP-${Date.now()}`,
      studentNameEnglish,
      studentNameMotherTongue,
      email,
      phone,
      whatsapp,
      dob,
      age,
      fatherName,
      gender,
      aadharNo,
      religion,
      community,
      maritalStatus,
      center: (req.user && (req.user.role === 'center' || req.user.role === 'hr')) ? req.user.center : center,
      nationality,

      // Identifiers
      kcetRegNo,
      neetRegNo,
      apaarId,
      debId,
      abcId,

      address: address || {
        village,
        post,
        taluk,
        district,
        pin
      },

      englishFluency,
      languagesKnown: [language1, language2, language3].filter(Boolean),

      bankDetails: {
        accountHolderName,
        accountNumber,
        ifscCode,
        bankNameBranch,
      },

      educationBackground,
      sslcSubjects,
      sslcDetails,
      hscSubjects,
      hscDetails,
      familyBackground,
      references,

      year,
      department,
      status: 'active'
    });

    // 3️⃣ Link Student to User
    user.studentProfile = student._id;
    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      studentId: student.studentId
    });

  } catch (error) {
    console.error("PUBLIC REGISTRATION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

// // ======================================================
//   '/',
//   upload.fields([
//     { name: 'profilePic', maxCount: 1 },
//     { name: 'idFile', maxCount: 1 },
//     { name: 'certificateFile', maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//      const {
//   studentNameEnglish,
//   studentNameMotherTongue,
//   fatherName,
//   dob,
//   age,
//   gender,
//   nationality,
//   aadharNo,
//   kcetRegNo,
//   neetRegNo,
//   apaarId,
//   debId,
//   abcId,
//   religion,
//   community,
//   maritalStatus,
//   email,
//   phone,
//   whatsapp,
//   village,
//   post,
//   taluk,
//   district,
//   pin,
//   englishFluency,
//   language1,
//   language2,
//   language3,
//   accountHolderName,
//   accountNumber,
//   ifscCode,
//   bankNameBranch,
//   role,
// } = req.body;

//       // Check if email already exists
//       const existingUser = await User.findOne({ email });
//       if (existingUser) {
//         return res.status(400).json({
//           message: 'User with this email already exists',
//         });
//       }

//       const defaultPassword = "Student@123";

//       // 1️⃣ Create User
//       const user = await User.create({
//        name: studentNameEnglish,
//         email,
//         password: defaultPassword,
//         role: role || 'student',
//       });

//       // Helper function for file
//       const getFileData = (fieldName) => {
//         if (req.files && req.files[fieldName]) {
//           const file = req.files[fieldName][0];
//           return {
//             url: file.path,
//             public_id: file.filename,
//             name: file.originalname,
//           };
//         }
//         return null;
//       };

//       // 2️⃣ Create Student
//       const student = await Student.create({
//   user: user._id,

//   studentNameEnglish,
//   studentNameMotherTongue,
//   fatherName,
//   dob,
//   age,
//   gender,
//   nationality,

//   aadharNo,
//   kcetRegNo,
//   neetRegNo,
//   apaarId,
//   debId,
//   abcId,

//   religion,
//   community,
//   maritalStatus,

//   email,
//   phone,
//   whatsapp,

//   address: {
//     village,
//     post,
//     taluk,
//     district,
//     pin,
//   },

//   englishFluency,
//   languagesKnown: [language1, language2, language3],

//   bankDetails: {
//     accountHolderName,
//     accountNumber,
//     ifscCode,
//     bankNameBranch,
//   },
// });

//       // 3️⃣ Link Student to User
//       user.studentProfile = student._id;
//       await user.save();

//       res.status(201).json({
//         message: 'Student created successfully',
//         student,
//       });

//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// ======================================================
// GET ALL STUDENTS (From Users Collection)
// ======================================================
// ======================================================
// GET ALL STUDENTS (FULL DATA)
// ======================================================
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    const userRole = req.user.role.toLowerCase();

    if (userRole === "center") {
      query.center = req.user.center;
    } else if (userRole === "coach") {
      // Find all courses assigned to this coach
      const coachCourses = await Course.find({ instructor: req.user._id }).select("_id");
      const coachCourseIds = coachCourses.map(c => c._id);
      
      // Filter students who are enrolled in ANY of these coach's courses
      query["enrolledCourses.course"] = { $in: coachCourseIds };
    }

    const students = await Student.find(query)
      .populate("user", "-password")
      .populate("parent", "name email")
      .populate("enrolledCourses.course", "title price category duration")
      .populate("center", "name location");

    res.json({
      count: students.length,
      students,
    });

  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

// ======================================================
// GET STUDENT BY USER _ID
router.get('/user/:id', protect, async (req, res) => {
  try {
    const userId = req.params.id;

    // First, find the user by their Mongo _id
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Then, find the corresponding student profile (if exists)
    const student = await Student.findOne({ user: user._id }).populate("center", "name location");

    res.json({
      user,
      studentProfile: student || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// ======================================================
// UPDATE STUDENT (Updates BOTH User + Student)
// ======================================================
const { admin } = require("../middleware/authMiddleware");
router.put(
  "/:id",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "idFile", maxCount: 1 },
    { name: "certificateFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check authorization: Admin or the student themselves
      if (req.user.role !== 'admin' && student.user?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this profile" });
      }

      const data = { ...req.body };

      // =========================
      // CLEAN DATA
      // =========================
      // Remove fields that should not be directly overwritten or are populated
      const fieldsToRemove = ["_id", "user", "createdAt", "updatedAt", "__v"];
      fieldsToRemove.forEach(field => delete data[field]);

      // Ensure center is handled as an ID
      if (data.center && typeof data.center === "object") {
        data.center = data.center._id;
      }
      
      // Ensure parent is handled as an ID
      if (data.parent && typeof data.parent === "object") {
        data.parent = data.parent._id;
      }

      // Safety check for enrolledCourses to prevent validation errors
      if (data.enrolledCourses && Array.isArray(data.enrolledCourses)) {
        data.enrolledCourses = data.enrolledCourses.filter(item => typeof item === "object" && item !== null);
      }

      // =========================
      // UPDATE STUDENT FIELDS
      // =========================
      Object.assign(student, data);

      // =========================
      // UPDATE FILES (IF PROVIDED)
      // =========================

      const updateFile = (field, existing) => {
        if (req.files && req.files[field]) {
          const file = req.files[field][0];
          return {
            url: file.path,
            public_id: file.filename,
            name: file.originalname,
          };
        }
        return existing;
      };

      student.profilePic = updateFile("profilePic", student.profilePic);
      student.idFile = updateFile("idFile", student.idFile);
      student.certificateFile = updateFile(
        "certificateFile",
        student.certificateFile
      );

      await student.save();

      // =========================
      // UPDATE USER DATA
      // =========================

      if (student.user) {
        const user = await User.findById(student.user);
        const updateData = {};
        
        if (req.body.email && req.body.email !== user.email) {
          // Verify OTP for email change
          const { otp } = req.body;
          if (!otp) {
            return res.status(400).json({ message: "OTP is required to change email" });
          }
          const Otp = require('../models/Otp');
          const otpRecord = await Otp.findOne({ email: req.body.email, otp });
          if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
          }
          // Delete OTP after verification
          await Otp.deleteOne({ _id: otpRecord._id });
          
          updateData.email = req.body.email;
        }
        
        if (req.body.studentNameEnglish) updateData.name = req.body.studentNameEnglish;

        if (req.files && req.files.profilePic) {
          updateData.profilePic = {
            url: req.files.profilePic[0].path,
            public_id: req.files.profilePic[0].filename,
            name: req.files.profilePic[0].originalname,
          };
        }

        if (Object.keys(updateData).length > 0) {
          await User.findByIdAndUpdate(
            student.user,
            updateData,
            { new: true }
          );
        }
      }

      const updatedStudent = await Student.findById(student._id)
        .populate("user", "-password")
        .populate("parent", "name email")
        .populate("enrolledCourses.course", "title price category duration")
        .populate("center", "name location");

      res.json({
        message: "Student updated successfully",
        student: updatedStudent,
      });

    } catch (error) {
      console.error("UPDATE STUDENT ERROR:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// ======================================================
// DELETE STUDENT (Deletes BOTH User + Student)
// ======================================================
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    // 1️⃣ Find student first
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2️⃣ Delete linked user account
    await User.findByIdAndDelete(student.user);

    // 3️⃣ Delete student document
    await Student.findByIdAndDelete(req.params.id);

    res.json({
      message: "Student and linked user deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================================
// TOGGLE STATUS
// ======================================================
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.status =
      student.status === 'active' ? 'inactive' : 'active';

    await student.save();

    res.json({
      message: `Student ${student.status === 'active' ? 'unblocked' : 'blocked'
        } successfully`,
      status: student.status,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//////////////////////////////////////////////////////
// PROMOTE STUDENT AS INTERN (HR/Admin)
//////////////////////////////////////////////////////
router.post("/:id/promote-intern", protect, async (req, res) => {
  try {
    const { vendorId, location, startDate, endDate, paymentBy, salary } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: "Only admin or HR can promote a student" });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const internshipData = {
      vendor: vendor._id,
      vendorName: vendor.companyName,
      location,
      startDate,
      endDate,
      paymentBy,
      salary,
      status: 'active'
    };

    if (student.internships && student.internships.length > 0) {
      // Update the last internship
      const lastIndex = student.internships.length - 1;
      student.internships.set(lastIndex, internshipData);
    } else {
      student.internships.push(internshipData);
    }

    student.markModified('internships');
    await student.save();

    const updatedStudent = await Student.findById(student._id)
      .populate("user", "-password")
      .populate("parent", "name email")
      .populate("enrolledCourses.course", "title price category duration")
      .populate("center", "name location");

    res.json({ message: "Student promoted as intern successfully", student: updatedStudent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;