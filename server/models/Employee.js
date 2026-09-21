const mongoose = require("mongoose");

// ✅ Define document schema
const documentSchema = new mongoose.Schema({
  url: String,
  name: String,
});

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: String,
    lastName: String,
    phone: String,

    dob: Date,

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    employeeId: {
      type: String,
      unique: true,
    },

    joiningDate: Date,
    department: String,
    designation: String,
    employmentType: String,

    salary: {
      type: Number,
      default: 0,
    },

    shift: {
      start: String,
      end: String,
    },

    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
    },

    // ✅ FIXED
    profilePic: documentSchema,
    idFile: documentSchema,
    certificateFile: documentSchema,
    contractFile: documentSchema,

    role: {
      type: String,
      enum: ["coach", "hr"],
      default: "coach",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "on-leave"],
      default: "active",
    },

    leaveBalances: {
      privilegedLeave: { type: Number, default: 0 },
      sickLeave: { type: Number, default: 0 },
      casualLeave: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// ✅ Indexes
employeeSchema.index({ center: 1 });

module.exports = mongoose.model("Employee", employeeSchema);