const mongoose = require("mongoose");

const adjustmentSchema = new mongoose.Schema({
  type: { type: String, enum: ["allowance", "deduction", "advance"], required: true },
  amount: { type: Number, required: true },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    
    internshipId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Link to specific internship period
    vendorName: { type: String, default: "" }, // For display purpose when multiple internships exist

    basicSalary: { type: Number, required: true, default: 0 },

    // Only total amounts now
    totalAllowances: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },

    advance: { type: Number, default: 0 },

    totalDays: { type: Number, default: 30 },
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    lateTime: { type: Number, default: 0 },

    netSalary: { type: Number, default: 0 },

    // Store multiple adjustments
    adjustments: [adjustmentSchema],

    status: { type: String, enum: ["processing", "hold"], default: "processing" },
  },
  { timestamps: true }
);

// Ensure unique payroll per employee/month/year/internship
payrollSchema.index({ employee: 1, month: 1, year: 1, internshipId: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", payrollSchema);