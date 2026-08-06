const express = require("express");
const router = express.Router();
const VendorPayment = require("../models/VendorPayment");

router.get("/", async (req, res) => {
  try {
    const payments = await VendorPayment.find()
      .populate({ path: "vendor", select: "companyName contactPerson user" })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error("Error fetching vendor payments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { vendor, title, amount, status } = req.body;
    if (!vendor || !title || amount === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const payment = new VendorPayment({ vendor, title, amount, status });
    await payment.save();
    const populatedPayment = await VendorPayment.findById(payment._id).populate({
      path: "vendor",
      select: "companyName contactPerson user",
    });
    res.status(201).json(populatedPayment);
  } catch (err) {
    console.error("Error creating vendor payment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle status
router.patch("/:id/toggle-status", async (req, res) => {
  try {
    const payment = await VendorPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    payment.status = payment.status === "paid" ? "pending" : "paid";
    await payment.save();
    const populatedPayment = await VendorPayment.findById(payment._id).populate({
      path: "vendor",
      select: "companyName contactPerson user",
    });
    res.json(populatedPayment);
  } catch (err) {
    console.error("Error toggling status:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete vendor payment
router.delete("/:id", async (req, res) => {
  try {
    const payment = await VendorPayment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error("Error deleting vendor payment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Generate receipt/voucher PDF
router.get('/:id/receipt', async (req, res) => {
  try {
    const payment = await VendorPayment.findById(req.params.id)
      .populate("vendor", "companyName contactPerson email phone");

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const { generateReceiptPDF } = require('../utils/receiptGenerator');

    const data = {
      documentTitle: "PAYMENT VOUCHER",
      receiptNo: payment._id.toString().substring(0, 8).toUpperCase(),
      date: payment.date || payment.createdAt,
      transactionId: "N/A",
      billedTo: {
        name: payment.vendor?.companyName || "Vendor",
        id: "VENDOR",
        email: payment.vendor?.email || "",
        phone: payment.vendor?.contactPerson || payment.vendor?.phone || ""
      },
      items: [
        {
          description: payment.title || "Vendor Payment",
          qty: 1,
          amount: payment.amount
        }
      ],
      totalAmount: payment.amount,
      status: payment.status
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
