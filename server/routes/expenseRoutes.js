const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const Expense = require("../models/Expenses");
const Payment = require("../models/Payment");
const { protect } = require("../middleware/authMiddleware");

// =================================================
// ================= UPLOAD CONFIG =================
// =================================================

const uploadPath = "uploads/receipts";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(
      null,
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${ext}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, PDF allowed"));
    }
    cb(null, true);
  },
});

// =================================================
// ================ CREATE EXPENSE =================
// =================================================

router.post("/", protect, upload.single("receipt"), async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const expense = await Expense.create({
      title,
      amount: Number(amount),
      category,
      description,
      date: date ? new Date(date) : Date.now(),
      receipt: req.file?.path,
      submittedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================
// ================ GET ALL EXPENSES ===============
// =================================================

router.get("/", protect, async (req, res) => {
  try {
    const role = req.user.role.toLowerCase();

    let query = {};

    if (role !== "admin" && role !== "finance") {
      query = { submittedBy: req.user._id };
    }

    const expenses = await Expense.find(query)
      .populate("submittedBy", "name email role")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================
// ================ APPROVE / REJECT ===============
// =================================================

router.patch("/:id/status", protect, async (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Not found" });

    expense.status = status;
    expense.approvedBy = req.user._id;
    expense.approvedAt = Date.now();

    await expense.save();

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================
// ================ REIMBURSE (OUTWARD) ============
// =================================================

router.patch("/:id/reimburse", protect, async (req, res) => {
  try {
    const role = req.user.role.toLowerCase();

    if (role !== "admin" && role !== "finance") {
      return res.status(403).json({ message: "Admin/Finance only" });
    }

    const { paymentMethod, transactionId } = req.body;

    const expense = await Expense.findById(req.params.id)
      .populate("submittedBy", "name email");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.status !== "approved") {
      return res
        .status(400)
        .json({ message: "Expense must be approved first" });
    }

    // =========================
    // UPDATE EXPENSE
    // =========================

    expense.status = "reimbursed";
    expense.reimbursement.status = "paid";
    expense.reimbursement.paidAt = Date.now();
    expense.reimbursement.paymentMethod = paymentMethod;
    expense.reimbursement.transactionId = transactionId;

    await expense.save();

    // =========================
    // CREATE OUTWARD PAYMENT
    // =========================

    const outwardPayment = await Payment.create({
      type: "outward",

      amount: expense.amount,

      recipientName: expense.submittedBy?.name || "Employee",

      recipientType: "employee",

      category: "reimbursement",

      paymentMethod: paymentMethod,

      status: "paid",

      notes: `Expense reimbursement for ${expense.title}`,

      referenceInvoice: expense._id.toString(),
    });

    res.json({
      success: true,
      message: "Expense reimbursed and outward payment recorded",
      expense,
      outwardPayment,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================
// ================ CATEGORY REPORT ================
// =================================================

router.get("/reports/category", protect, async (req, res) => {
  try {
    let match = {
      status: "reimbursed",
      "reimbursement.status": "paid",
    };

    if (req.user.role.toLowerCase() !== "admin") {
      match.submittedBy = req.user._id;
    }

    const report = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================
// ================ MONTHLY REPORT =================
// =================================================

router.get("/reports/monthly", protect, async (req, res) => {
  try {
    let match = {
      status: "reimbursed",
      "reimbursement.status": "paid",
    };

    if (req.user.role.toLowerCase() !== "admin") {
      match.submittedBy = req.user._id;
    }

    const report = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $month: "$date" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================
// ================ SUMMARY REPORT =================
// =================================================

router.get("/reports/summary", protect, async (req, res) => {
  try {
    let match = {
      status: "reimbursed",
      "reimbursement.status": "paid",
    };

    if (req.user.role.toLowerCase() !== "admin") {
      match.submittedBy = req.user._id;
    }

    const result = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPaidExpenses: { $sum: "$amount" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: result[0] || {
        totalPaidExpenses: 0,
        totalCount: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================
// ============ GET ALL REIMBURSED EXPENSES ========
// =================================================

router.get("/reimbursed", protect, async (req, res) => {
  try {
    const role = req.user.role.toLowerCase();

    let query = {
      status: "reimbursed",
      "reimbursement.status": "paid",
    };

    // Non-admin users can see only their reimbursed expenses
    if (role !== "admin" && role !== "finance") {
      query.submittedBy = req.user._id;
    }

    const expenses = await Expense.find(query)
      .populate("submittedBy", "name email role")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================
// ================= DELETE EXPENSE ===============
// =================================================

router.delete("/:id", protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const role = req.user.role.toLowerCase();

    // Only admin can delete any expense
    // Normal user can delete only their own expense
    if (
      role !== "admin" &&
      expense.submittedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Prevent deleting reimbursed (paid) expenses
    if (
      expense.status === "reimbursed" &&
      expense.reimbursement?.status === "paid"
    ) {
      return res.status(400).json({
        message: "Cannot delete reimbursed (paid) expense",
      });
    }

    // Delete receipt file if exists
    if (expense.receipt && fs.existsSync(expense.receipt)) {
      fs.unlinkSync(expense.receipt);
    }

    await expense.deleteOne();

    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("student", "studentNameEnglish email")
      .populate("course", "title")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================
// ============== GENERATE RECEIPT PDF =============
// =================================================

router.get("/:id/receipt", protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("submittedBy", "name email");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.status !== "reimbursed" || expense.reimbursement?.status !== "paid") {
      return res.status(400).json({ message: "Expense is not fully reimbursed yet" });
    }

    const { generateReceiptPDF } = require("../utils/receiptGenerator");

    const data = {
      documentTitle: "REIMBURSEMENT VOUCHER",
      receiptNo: expense._id.toString().substring(0, 8).toUpperCase(),
      date: expense.reimbursement?.paidAt || Date.now(),
      transactionId: expense.reimbursement?.transactionId || "N/A",
      billedTo: {
        name: expense.submittedBy?.name || "Employee",
        id: expense.submittedBy?._id.toString().substring(0, 8).toUpperCase(),
        email: expense.submittedBy?.email || "",
        phone: ""
      },
      items: [
        {
          description: expense.title || "Expense Reimbursement",
          qty: 1,
          amount: expense.amount
        }
      ],
      totalAmount: expense.amount,
      status: "PAID"
    };

    generateReceiptPDF(res, data);

  } catch (error) {
    console.error("Receipt generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate receipt" });
    }
  }
});

module.exports = router;