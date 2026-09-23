const mongoose = require("mongoose");

// Define document schema
const documentSchema = new mongoose.Schema({
  url: String,
  name: String,
});

const pastEmploymentSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  designation: String,
  joiningDate: { type: Date, required: true },
  leavingDate: { type: Date, required: true },
  currency: { type: String, default: "INR" },
  salary: Number,
  companyGst: String
}, { _id: true });

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

    maritalStatus: String,
    bloodGroup: String,
    guardianName: String,
    
    emergencyContactName: String,
    emergencyContactMobile: String,
    emergencyContactRelationship: String,
    emergencyContactAddress: String,

    aadhaar: String,
    pan: String,
    drivingLicense: String,
    voterId: String,
    uan: String,

    currentAddress: String,
    permanentAddress: String,

    employeeId: {
      type: String,
      unique: true,
    },

    joiningDate: Date,
    dateOfLeaving: Date,
    
    // Changing from single string to array to support multiple tags
    branches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Center" }],
    departments: [String],
    
    department: String, // Keeping old one for backward compatibility
    designation: String,
    jobTitle: String,
    employmentType: String,
    officialEmail: String,
    esiNumber: String,
    pfNumber: String,

    pastEmployment: [pastEmploymentSchema],

    
    
    
    attendanceDetails: {
      timezone: { type: String, default: 'Kolkata, Asia' },
      staffCanViewOwnAttendance: { type: Boolean, default: true },
      
      workTimings: {
        workTimingType: { type: String, enum: ['fixed', 'flexible'], default: 'fixed' },
        schedule: {
          mon: { isWeekoff: { type: Boolean, default: false }, weekoffType: { type: [String], default: ['All Weeks'] }, shifts: [{ name: { type: String, default: 'genral' }, startTime: { type: String, default: '09:00 AM' }, endTime: { type: String, default: '05:00 PM' } }] },
          tue: { isWeekoff: { type: Boolean, default: false }, weekoffType: { type: [String], default: ['All Weeks'] }, shifts: [{ name: { type: String, default: 'genral' }, startTime: { type: String, default: '09:00 AM' }, endTime: { type: String, default: '05:00 PM' } }] },
          wed: { isWeekoff: { type: Boolean, default: false }, weekoffType: { type: [String], default: ['All Weeks'] }, shifts: [{ name: { type: String, default: 'genral' }, startTime: { type: String, default: '09:00 AM' }, endTime: { type: String, default: '05:00 PM' } }] },
          thu: { isWeekoff: { type: Boolean, default: false }, weekoffType: { type: [String], default: ['All Weeks'] }, shifts: [{ name: { type: String, default: 'genral' }, startTime: { type: String, default: '09:00 AM' }, endTime: { type: String, default: '05:00 PM' } }] },
          fri: { isWeekoff: { type: Boolean, default: false }, weekoffType: { type: [String], default: ['All Weeks'] }, shifts: [{ name: { type: String, default: 'genral' }, startTime: { type: String, default: '09:00 AM' }, endTime: { type: String, default: '05:00 PM' } }] },
          sat: { isWeekoff: { type: Boolean, default: false }, weekoffType: { type: [String], default: ['All Weeks'] }, shifts: [{ name: { type: String, default: 'genral' }, startTime: { type: String, default: '09:00 AM' }, endTime: { type: String, default: '05:00 PM' } }] },
          sun: { isWeekoff: { type: Boolean, default: true }, weekoffType: { type: [String], default: ['All Weeks'] }, shifts: [] }
        }
      },
      
      attendanceModes: {
        staffAppPunchIn: { type: Boolean, default: true },
        selfieAttendance: { type: Boolean, default: true },
        qrAttendance: { type: Boolean, default: false },
        gpsAttendance: {
          enabled: { type: Boolean, default: true },
          markFrom: { type: String, enum: ['office', 'anywhere'], default: 'office' },
          radius: { type: Number, default: 200 }
        }
      },
      
      biometricDevices: [{
        deviceName: String,
        serialNumber: String
      }],
      
      kioskDevices: [{
        kioskName: String,
        dialCode: String,
        phoneNumber: String
      }],
      
      automationRules: {
        autoPresentAtDayStart: { type: Boolean, default: false },
        presentOnPunchIn: { type: Boolean, default: true },
        autoHalfDayIfLateBy: { type: Number, default: null }, 
        mandatoryHalfDayHours: { type: Number, default: null }, 
        mandatoryFullDayHours: { type: Number, default: null }
      }
    },


      salaryDetails: {
      effectiveDate: { type: String, default: '' },
      salaryType: { type: String, enum: ['Per Month', 'Per Day', 'Per Hour'], default: 'Per Month' },
      salaryStructure: { type: String, enum: ['default', 'custom'], default: 'default' },
      ctcAmount: { type: Number, default: 0 },
      earnings: [{
        head: String,
        calculation: { type: String, default: 'On Attendance' },
        amount: { type: Number, default: 0 }
      }],
      employerContributions: [{
        head: String,
        calculation: { type: String, default: 'None' },
        includedInCtc: { type: Boolean, default: false },
        amount: { type: Number, default: 0 }
      }],
      employeeContributions: [{
        head: String,
        calculation: { type: String, default: 'None' },
        amount: { type: Number, default: 0 }
      }],
      deductions: [{
        head: String,
        calculation: { type: String, default: 'None' },
        amount: { type: Number, default: 0 }
      }]
    },

    leaveDetails: {
      leaveCycle: { type: String, enum: ['Monthly', 'Yearly'], default: 'Monthly' },
      leavePolicy: [{
        leaveType: { type: String },
        allowedLeaves: { type: Number, default: 0 },
        carryForwardLeaves: { type: Number, default: 0 }
      }],
      leaveBalance: [{
        leaveType: { type: String },
        remainingBalance: { type: Number, default: 0 }
      }]
    },

    penaltyDetails: {
      earlyAllowedDays: { type: Number, default: 0 },
      earlyMins: { type: Number, default: 0 },
      earlyDynamic: { type: Boolean, default: false },
      earlyDeductionType: { type: String, default: 'Fixed Daily Rate' },
      earlyAmount: { type: Number, default: 0 },

      lateAllowedDays: { type: Number, default: 0 },
      lateMins: { type: Number, default: 0 },
      lateDynamic: { type: Boolean, default: false },
      lateDeductionType: { type: String, default: 'Fixed Hourly Rate' },
      lateAmount: { type: Number, default: 50 },

      overtimeMins: { type: Number, default: 0 },
      overtimeExtraPayType: { type: String, default: 'Fixed Hourly Rate' },
      overtimeExtraAmount: { type: Number, default: 0 },
      overtimeHolidayPayType: { type: String, default: 'Fixed Daily Rate' },
      overtimeHolidayAmount: { type: Number, default: 0 },
      overtimeWeekoffPayType: { type: String, default: 'Fixed Daily Rate' },
      overtimeWeekoffAmount: { type: Number, default: 0 }
    },

    documents: [{
      documentType: { type: String, required: true },
      customDocumentName: { type: String },
      file: documentSchema,
      addedOn: { type: Date, default: Date.now }
    }],

    bankDetails: {
      paymentMode: { type: String, enum: ['bank', 'upi'], default: 'bank' },
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      upiId: String,
    },

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