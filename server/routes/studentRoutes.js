const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const Student = require('../models/Student');
const User = require('../models/User');
const Course = require('../models/Course');
const Vendor = require('../models/Vendor');
const StudentFee = require('../models/StudentFee');
const Batch = require('../models/Batch');
const Center = require('../models/Center');

// ======================================================
// PUBLIC REGISTRATION (Apply Now)
// ======================================================
const { protect, optionalProtect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { publicRegistrationValidation } = require("../validators/studentValidator");
const { createInAppNotification, sendEmailNotification } = require("../utils/notificationUtils");

router.post('/public-registration', optionalProtect, publicRegistrationValidation, validate, async (req, res) => {
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

    const finalName = (studentNameEnglish && studentNameEnglish.trim()) || "";
    const finalEmail = (email && email.trim()) ? email.trim() : `student_${Date.now()}@dracademy.internal`;
    const finalPhone = phone || "";

    // Check if email already exists
    if (email && email.trim()) {
      const existingUser = await User.findOne({ email: email.trim() });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }

    const defaultPassword = "Student@123";

    // 1️⃣ Create User
    const user = await User.create({
      name: finalName,
      email: finalEmail,
      password: defaultPassword,
      role: 'student',
      mobile: finalPhone
    });

    // 2️⃣ Create Student Profile
    const student = await Student.create({
      user: user._id,
      studentId: `APP-${Date.now()}`,
      studentNameEnglish: finalName,
      studentNameMotherTongue,
      email: finalEmail,
      phone: finalPhone,
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
      status: 'active'
    });

    if (req.user && req.user.role === 'admin' && req.body.adminEnrollment) {
      const { course, batch, fees } = req.body.adminEnrollment;
      if (course) {
        student.enrolledCourses.push({
          course: course,
          batch: batch || undefined,
          completed: false,
          progress: 0
        });
      }
      
      // Save student here to get _id for fees
      await student.save();

      // Update Batch model to include this student
      if (batch) {
        await Batch.findByIdAndUpdate(batch, { $addToSet: { students: student._id } });
      }

      if (fees && Array.isArray(fees) && fees.length > 0) {
        for (const fee of fees) {
          if (fee.amount && Number(fee.amount) > 0) {
            const validFeeType = ['Term', 'Sem', 'Exam', 'Other', 'Monthly'].includes(fee.feeType) ? fee.feeType : 'Other';
            await StudentFee.create({
              student: student._id,
              center: student.center,
              course: course || undefined,
              batch: batch || undefined,
              feeType: validFeeType,
              otherFeeType: fee.otherFeeType || (validFeeType === 'Other' ? (fee.feeType || 'Fee') : undefined),
              amount: Number(fee.amount),
              status: 'pending',
              year: student.year
            });
          }
        }
      }
    } else {
      await student.save();
    }
    user.studentProfile = student._id;
    await user.save();

    // 4️⃣ Send Notifications
    await createInAppNotification({
      recipient: user._id,
      type: 'registration_success',
      title: 'Registration Successful',
      message: `Welcome to DRRJ Academy! Your registration is successful. Your Student ID is ${student.studentId}.`,
      entityId: student._id.toString()
    });

    await sendEmailNotification({
      to: email,
      subject: 'Welcome to DRRJ Academy - Registration Successful',
      html: `
        <h2>Welcome, ${studentNameEnglish}!</h2>
        <p>Your registration is complete.</p>
        <p><strong>Student ID:</strong> ${student.studentId}</p>
        <p><strong>Default Password:</strong> ${defaultPassword}</p>
        <p>Please login and change your password.</p>
      `
    });

    res.status(201).json({
      message: 'Registration successful',
      studentId: student.studentId
    });

  } catch (error) {
    console.error("PUBLIC REGISTRATION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

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
      .populate("center", "centerId name location");

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

      // If enrolledCourses contains a batch, ensure the student is added to that Batch
      if (data.enrolledCourses && Array.isArray(data.enrolledCourses)) {
        const Batch = require('../models/Batch');
        
        // First, remove this student from all batches to clear old assignments
        await Batch.updateMany(
          { students: student._id },
          { $pull: { students: student._id } }
        );

        for (const ec of data.enrolledCourses) {
          if (ec.batch) {
            await Batch.findByIdAndUpdate(ec.batch, { $addToSet: { students: student._id } });
          }
        }
      }

      // =========================
      // UPDATE FEES DATA
      // =========================
      if (req.body.fees && Array.isArray(req.body.fees)) {
        const StudentFee = require('../models/StudentFee');
        const incomingFees = req.body.fees;
        
        // 1. Delete fees that are no longer in the list
        const incomingFeeIds = incomingFees.filter(f => f._id).map(f => f._id);
        await StudentFee.deleteMany({
          student: student._id,
          _id: { $nin: incomingFeeIds }
        });

        // 2. Update existing fees or create new ones
        for (const fee of incomingFees) {
          if (fee.amount && Number(fee.amount) > 0) {
            const validFeeType = ['Term', 'Sem', 'Exam', 'Other', 'Monthly'].includes(fee.feeType) ? fee.feeType : 'Other';
            
            const feeData = {
              student: student._id,
              center: student.center,
              feeType: validFeeType,
              otherFeeType: fee.otherFeeType || fee.name,
              name: fee.name || fee.otherFeeType,
              amount: Number(fee.amount),
              status: fee.status || "pending",
              dueDate: fee.dueDate
            };

            if (data.enrolledCourses && data.enrolledCourses.length > 0) {
               feeData.course = data.enrolledCourses[0].course || undefined;
               feeData.batch = data.enrolledCourses[0].batch || undefined;
            }

            if (fee._id) {
              await StudentFee.findByIdAndUpdate(fee._id, feeData);
            } else {
              await StudentFee.create(feeData);
            }
          }
        }
      }

      // =========================
      // UPDATE USER DATA
      // =========================

      if (student.user) {
        const user = await User.findById(student.user);
        const updateData = {};

        if (req.body.email && req.body.email !== user.email) {
          if (req.user.role !== 'admin') {
            // Verify OTP for email change for non-admin
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
          }

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
const adminOrCenter = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'center')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized: Access denied' });
  }
};

router.delete("/:id", protect, adminOrCenter, async (req, res) => {
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

    // 4️⃣ Delete all linked student fees
    await StudentFee.deleteMany({ student: req.params.id });

    // 5️⃣ Remove from Batches
    const Batch = require('../models/Batch');
    await Batch.updateMany(
      { students: req.params.id },
      { $pull: { students: req.params.id } }
    );
    // Update numberOfStudents for affected batches
    const affectedBatches = await Batch.find({ students: req.params.id });
    for (const b of affectedBatches) {
      b.numberOfStudents = b.students.length;
      await b.save();
    }

    res.json({
      message: "Student, linked user and fee records deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================================
// BULK DELETE STUDENTS (Deletes User + Student + Fees)
// ======================================================
router.post("/bulk-delete", protect, adminOrCenter, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No student IDs provided" });
    }

    const Batch = require('../models/Batch');
    for (const id of ids) {
      const student = await Student.findById(id);
      if (student) {
        if (student.user) {
          await User.findByIdAndDelete(student.user);
        }
        await Student.findByIdAndDelete(id);
        await StudentFee.deleteMany({ student: id });
        
        await Batch.updateMany(
          { students: id },
          { $pull: { students: id } }
        );
      }
    }

    // Update numberOfStudents for all batches that were modified
    const allBatches = await Batch.find();
    for (const b of allBatches) {
      b.numberOfStudents = b.students.length;
      await b.save();
    }

    res.json({
      message: `${ids.length} students and their linked records deleted successfully`,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================================
// TOGGLE STATUS
// ======================================================
router.patch('/:id/status', protect, adminOrCenter, async (req, res) => {
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
    const { vendorId, location, startDate, endDate, paymentBy, salary, vendorPayment, referralCharge, isNewPeriod } = req.body;

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
      vendorPayment,
      referralCharge,
      status: 'active'
    };

    if (student.internships && student.internships.length > 0 && !isNewPeriod) {
      // Update the last internship
      const lastIndex = student.internships.length - 1;
      student.internships.set(lastIndex, internshipData);
    } else {
      // Add as new internship period
      if (student.internships && student.internships.length > 0) {
        // Safely close out the old period
        const lastIndex = student.internships.length - 1;
        const prevInternship = student.internships[lastIndex];
        prevInternship.status = 'completed';
        
        // If it didn't have an end date, set it to the day before the new one starts
        if (!prevInternship.endDate && startDate) {
          const newStart = new Date(startDate);
          const prevEnd = new Date(newStart);
          prevEnd.setDate(newStart.getDate() - 1);
          prevInternship.endDate = prevEnd;
        }
        student.internships.set(lastIndex, prevInternship);
      }
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

//////////////////////////////////////////////////////
// BULK PROMOTE STUDENTS AS INTERNS (HR/Admin)
//////////////////////////////////////////////////////
router.post("/bulk-promote-intern", protect, async (req, res) => {
  try {
    const { studentIds, vendorId, location, startDate, endDate, paymentBy, salary, vendorPayment, referralCharge, isNewPeriod } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: "Only admin or HR can promote students" });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "No students provided" });
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
      vendorPayment,
      referralCharge,
      status: 'active'
    };

    const students = await Student.find({ _id: { $in: studentIds } });

    for (const student of students) {
      if (student.internships && student.internships.length > 0 && !isNewPeriod) {
        // Update the last internship
        const lastIndex = student.internships.length - 1;
        student.internships.set(lastIndex, internshipData);
      } else {
        // Add as new internship period
        if (student.internships && student.internships.length > 0) {
          // Safely close out the old period
          const lastIndex = student.internships.length - 1;
          const prevInternship = student.internships[lastIndex];
          prevInternship.status = 'completed';
          
          if (!prevInternship.endDate && startDate) {
            const newStart = new Date(startDate);
            const prevEnd = new Date(newStart);
            prevEnd.setDate(newStart.getDate() - 1);
            prevInternship.endDate = prevEnd;
          }
          student.internships.set(lastIndex, prevInternship);
        }
        student.internships.push(internshipData);
      }
      student.markModified('internships');
      await student.save();
    }

    res.json({ message: `${students.length} students promoted to intern successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BULK ACADEMIC PROMOTE
//////////////////////////////////////////////////////
router.post("/bulk-promote-academic", protect, async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.role !== 'center') {
      return res.status(403).json({ message: "Not authorized to promote students" });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "No students provided" });
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    const StudentFee = require('../models/StudentFee');
    let promotedCount = 0;

    for (const student of students) {
      if (!student.year) continue;

      const yearMatch = student.year.match(/^(\d+)(st|nd|rd|th)\s+Year$/i) || student.year.match(/^(\d+)/);
      if (yearMatch) {
        const currentYearNum = parseInt(yearMatch[1], 10);
        const nextYearNum = currentYearNum + 1;
        
        let newYearStr = `${nextYearNum}th Year`;
        if (nextYearNum === 1) newYearStr = "1st Year";
        else if (nextYearNum === 2) newYearStr = "2nd Year";
        else if (nextYearNum === 3) newYearStr = "3rd Year";

        student.year = newYearStr;
        await student.save();

        // Duplicate base fees (ignore Council fees for now, or just duplicate course/term/sem fees)
        const currentFees = await StudentFee.find({ student: student._id });
        // Find only those that are not penalty generated
        const feesToDuplicate = currentFees.filter(f => f.feeType !== 'Council' && !f.isPenaltyApplied && !f.isFinalPenaltyApplied);
        
        for (const fee of feesToDuplicate) {
          const newFee = new StudentFee({
            student: fee.student,
            center: fee.center,
            course: fee.course,
            batch: fee.batch,
            feeType: fee.feeType,
            otherFeeType: fee.otherFeeType,
            terms: fee.terms,
            amount: fee.amount,
            status: 'pending',
            year: newYearStr
          });
          await newFee.save();
        }

        // Retroactively set the old year on the old fees if they didn't have one
        const oldYearStr = yearMatch[0];
        await StudentFee.updateMany(
          { student: student._id, year: { $exists: false } },
          { $set: { year: oldYearStr } }
        );
        promotedCount++;
      }
    }

    res.json({ message: `${promotedCount} students academically promoted successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BULK UPLOAD PREVIEW
//////////////////////////////////////////////////////
router.post("/bulk-upload-preview", protect, async (req, res) => {
  try {
    const { students } = req.body;
    
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.role !== 'center') {
      return res.status(403).json({ message: "Not authorized to perform bulk upload" });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "No student data provided" });
    }

    const validRecords = [];
    const duplicateRecords = [];
    const invalidRecords = [];
    const seenStudentIds = new Set();
    const seenEmails = new Set();

    for (let i = 0; i < students.length; i++) {
      const record = students[i];
      const recordId = record.id || `row-${i}`;
      
      let name = record["Name"];
      let studentId = record["Student ID"] ? String(record["Student ID"]).trim() : undefined;
      let dob = record["DOB"];
      let year = record["Year"];
      let centerIdStr = record["Center ID"];
      let batchIdStr = record["Batch ID"];
      let courseIdStr = record["Course ID"];
      let email = record["Email"];

      // 1. Mandatory Check
      if (!name || !dob || !courseIdStr || !batchIdStr || !centerIdStr || !year) {
        invalidRecords.push({
          id: recordId,
          ...record,
          reason: "Missing mandatory fields (Name, DOB, Course ID, Batch ID, Center ID, Year)"
        });
        continue;
      }

      const center = await Center.findOne({ centerId: centerIdStr });
      if (!center) {
        invalidRecords.push({ id: recordId, ...record, reason: `Center ID not found: ${centerIdStr}` });
        continue;
      }

      const batch = await Batch.findOne({ batchId: batchIdStr });
      if (!batch) {
        invalidRecords.push({ id: recordId, ...record, reason: `Batch ID not found: ${batchIdStr}` });
        continue;
      }

      const course = await Course.findOne({ courseId: courseIdStr });
      if (!course) {
        invalidRecords.push({ id: recordId, ...record, reason: `Course ID not found: ${courseIdStr}` });
        continue;
      }

      let isDuplicate = false;
      let duplicateReason = "";

      // Auto-generate missing student ID for preview
      if (!studentId) {
        const d = new Date();
        studentId = `STU-${d.getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
        record["Student ID"] = studentId; // update record for frontend
      } else {
        studentId = String(studentId).trim();
      }

      // Auto-generate missing email for preview
      if (!email || !email.trim()) {
        email = `${studentId}@drrgacademy.in`;
        record["Email"] = email; // update record for frontend
      }

      // 3. Duplicate Check
      if (studentId) {
        const existingStudent = await Student.findOne({ studentId });
        if (existingStudent) {
          isDuplicate = true;
          duplicateReason = "Student ID already exists";
        } else if (seenStudentIds.has(studentId)) {
          isDuplicate = true;
          duplicateReason = "Student ID duplicated in this file";
        }
        seenStudentIds.add(studentId);
      }
      
      if (!isDuplicate && email) {
        const emailTrimmed = email.trim();
        const existingUser = await User.findOne({ email: emailTrimmed });
        if (existingUser) {
          isDuplicate = true;
          duplicateReason = `Email already exists: ${emailTrimmed}`;
        } else if (seenEmails.has(emailTrimmed)) {
          isDuplicate = true;
          duplicateReason = "Email duplicated in this file";
        }
        seenEmails.add(emailTrimmed);
      }

      const enrichedRecord = {
        id: recordId,
        ...record,
        resolvedCenterId: center._id,
        resolvedBatchId: batch._id,
        resolvedCourseId: course._id
      };

      if (isDuplicate) {
        duplicateRecords.push({ ...enrichedRecord, reason: duplicateReason });
      } else {
        validRecords.push(enrichedRecord);
      }
    }

    res.json({ validRecords, duplicateRecords, invalidRecords });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// BULK UPLOAD COMMIT
//////////////////////////////////////////////////////
router.post("/bulk-upload", protect, async (req, res) => {
  try {
    const { recordsToProcess } = req.body;
    
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.role !== 'center') {
      return res.status(403).json({ message: "Not authorized to perform bulk upload" });
    }

    if (!Array.isArray(recordsToProcess) || recordsToProcess.length === 0) {
      return res.status(400).json({ message: "No records to process" });
    }

    let successCount = 0;
    const skippedRecords = [];

    for (const record of recordsToProcess) {
      try {
        const name = record["Name"];
        let studentId = record["Student ID"] ? String(record["Student ID"]).trim() : undefined;
        const dob = record["DOB"];
        const year = record["Year"];
        const email = record["Email"];
        
        const isUpdate = record.isUpdate;
        const centerId = record.resolvedCenterId;
        const batchId = record.resolvedBatchId;
        const courseId = record.resolvedCourseId;

        let parsedDob = new Date(dob);
        if (isNaN(parsedDob.getTime())) {
          parsedDob = new Date();
        }

        if (!isUpdate && !studentId) {
          const d = new Date();
          studentId = `STU-${d.getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
        }

        const finalEmail = (email && email.trim()) ? email.trim() : `${String(studentId).trim()}@drrgacademy.in`;

        if (isUpdate) {
          // Overwrite existing student
          const existingStudent = await Student.findOne({ studentId: String(studentId).trim() }).populate("user");
          if (!existingStudent) {
            skippedRecords.push({ name, studentId, reason: "Attempted to update but student not found" });
            continue;
          }

          // Update User
          if (existingStudent.user) {
            await User.findByIdAndUpdate(existingStudent.user._id, {
              name,
              email: finalEmail
            });
          }

          // Update Student
          // Check if course already enrolled
          let enrolled = existingStudent.enrolledCourses || [];
          const courseAlreadyEnrolled = enrolled.some(c => String(c.course) === String(courseId));
          if (!courseAlreadyEnrolled) {
            enrolled.push({
              course: courseId,
              batch: batchId,
              completed: false,
              progress: 0
            });
          }

          await Student.findByIdAndUpdate(existingStudent._id, {
            studentNameEnglish: name,
            dob: parsedDob,
            email: finalEmail,
            center: centerId,
            year,
            enrolledCourses: enrolled
          });

          // Update batch
          const batch = await Batch.findById(batchId);
          if (batch && !batch.students.includes(existingStudent._id)) {
            batch.students.push(existingStudent._id);
            await batch.save();
          }

          successCount++;
        } else {
          // Create new student
          const user = await User.create({
            name,
            email: finalEmail,
            password: "Student@123",
            role: "student",
          });

          const newStudent = await Student.create({
            user: user._id,
            studentId,
            studentNameEnglish: name,
            dob: parsedDob,
            email: finalEmail,
            center: centerId,
            year,
            enrolledCourses: [{
              course: courseId,
              batch: batchId,
              completed: false,
              progress: 0
            }]
          });

          const batch = await Batch.findById(batchId);
          if (batch && !batch.students.includes(newStudent._id)) {
            batch.students.push(newStudent._id);
            await batch.save();
          }

          successCount++;
        }
      } catch (err) {
        skippedRecords.push({ 
          name: record["Name"] || "Unknown", 
          studentId: record["Student ID"] || "", 
          reason: `System error: ${err.message}` 
        });
      }
    }

    res.json({ successCount, skippedRecords });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;