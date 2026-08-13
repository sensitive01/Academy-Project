const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: String,
    date: { type: Date, default: Date.now },
    receipt: String,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "reimbursed", "paid"],
      default: "pending",
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    reimbursement: {
      status: {
        type: String,
        enum: ["not_paid", "paid"],
        default: "not_paid",
      },
      paidAt: Date,
      paymentMethod: String,
      transactionId: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);