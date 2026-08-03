const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // BASIC DETAILS
    studentId: { type: String, unique: true },
    studentNameEnglish: { type: String, required: true },
    studentNameMotherTongue: String,
    fatherName: String,
    dob: Date,
    age: Number,
    gender: String,
    nationality: String,

    // ID DETAILS
    aadharNo: String,
    kcetRegNo: String,
    neetRegNo: String,
    apaarId: String,
    debId: String,
    abcId: String,

    religion: String,
    community: String,
    maritalStatus: String,

    // CONTACT
    email: { type: String, required: true },
    phone: String,
    whatsapp: String,

    // ADDRESS
    address: {
      village: String,
      post: String,
      taluk: String,
      district: String,
      pin: String,
    },

    // LANGUAGE
    englishFluency: String,
    languagesKnown: [String],

    // BANK DETAILS
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankNameBranch: String,
    },

    // ---------------------------
    // EDUCATIONAL BACKGROUND
    // ---------------------------

    educationBackground: [
      {
        examinationPassed: String,
        instituteName: String,
        group: String,
        yearOfPassing: String,
        marksPercentage: String,
        remarks: String,
      },
    ],

    // SSLC SUBJECTS
    sslcSubjects: [
      {
        subject: String,
        totalMark: Number,
        securedMark: Number,
      },
    ],

    sslcDetails: {
      registerNo: String,
      yearOfPassing: String,
      schoolName: String,
      placeOfSchool: String,
      boardOfExamination: String,
      percentage: String,
    },

    // HSC SUBJECTS
    hscSubjects: [
      {
        subject: String,
        totalMark: Number,
        securedMark: Number,
      },
    ],

    hscDetails: {
      registerNo: String,
      yearOfPassing: String,
      schoolName: String,
      placeOfSchool: String,
      boardOfExamination: String,
      percentage: String,
    },

    // ---------------------------
    // FAMILY BACKGROUND
    // ---------------------------

    familyBackground: [
      {
        relationship: String,
        name: String,
        occupation: String,
        phone: String,
      },
    ],

    // ---------------------------
    // REFERENCE FRIENDS
    // ---------------------------

    references: [
      {
        name: String,
        mobile: String,
      },
    ],

    // COURSE INFO
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        completed: { type: Boolean, default: false },
        completionDate: Date,
        progress: { type: Number, default: 0 }, // 0-100%
        certificateUrl: String,
      },
    ],

    // INTERNSHIP DETAILS
    internships: [
      {
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
        vendorName: String,
        location: String,
        startDate: Date,
        endDate: Date,
        paymentBy: String,
        salary: String,
        vendorPayment: String,
        referralCharge: String,
        status: { type: String, enum: ['active', 'completed', 'terminated'], default: 'active' }
      }
    ],

    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
    },
    year: String,
    department: String,

    profilePic: {
      url: String,
      public_id: String,
      name: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

studentSchema.index({ center: 1 });

module.exports = mongoose.model("Student", studentSchema);