const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");

const { protect } = require("../middleware/authMiddleware");

const Payment = require("../models/Payment");
const Course = require("../models/Course");
const Student = require("../models/Student");
const PDFDocument = require("pdfkit");
const toWords = require('number-to-words');

/////////////////////////////////////////////////////////////
// Razorpay Instance
/////////////////////////////////////////////////////////////

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/////////////////////////////////////////////////////////////
// CREATE ORDER
/////////////////////////////////////////////////////////////

router.post("/create-order", protect, async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    /////////////////////////////////////////////////////////////
    // FIND COURSE
    /////////////////////////////////////////////////////////////

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    /////////////////////////////////////////////////////////////
    // FIND STUDENT
    /////////////////////////////////////////////////////////////

    let student;

    // Parent enrolling child
    if (req.user.role === "parent") {
      if (!studentId) {
        return res.status(400).json({ message: "Student ID required" });
      }

      student = await Student.findOne({
        _id: studentId,
        parent: req.user._id,
      });
    }

    // Student enrolling self
    else {
      student = await Student.findOne({
        user: req.user._id,
      });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    /////////////////////////////////////////////////////////////
    // CHECK IF ALREADY ENROLLED
    /////////////////////////////////////////////////////////////

    if (!student.enrolledCourses) {
      student.enrolledCourses = [];
    }

    const alreadyEnrolled = student.enrolledCourses.some(
      (e) => (e.course ? e.course.toString() : e.toString()) === courseId
    );

    if (alreadyEnrolled) {
      return res
        .status(400)
        .json({ message: "Student already enrolled in this course" });
    }

    /////////////////////////////////////////////////////////////
    // CREATE RAZORPAY ORDER
    /////////////////////////////////////////////////////////////

    const order = await razorpay.orders.create({
      amount: course.price * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    /////////////////////////////////////////////////////////////
    // SAVE PAYMENT
    /////////////////////////////////////////////////////////////

    await Payment.create({
      type: "inward",
      student: student._id,
      course: course._id,
      amount: course.price,
      currency: order.currency,
      razorpayOrderId: order.id,
      receipt: order.receipt,
      status: "created",
    });

    /////////////////////////////////////////////////////////////
    // RESPONSE
    /////////////////////////////////////////////////////////////

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Order creation failed",
    });
  }
});

/////////////////////////////////////////////////////////////
// VERIFY PAYMENT
/////////////////////////////////////////////////////////////

router.post("/verify-payment", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
    } = req.body;

    /////////////////////////////////////////////////////////////
    // VERIFY SIGNATURE
    /////////////////////////////////////////////////////////////

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    /////////////////////////////////////////////////////////////
    // FIND PAYMENT
    /////////////////////////////////////////////////////////////

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    /////////////////////////////////////////////////////////////
    // FETCH PAYMENT DETAILS
    /////////////////////////////////////////////////////////////

    const paymentDetails = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paymentMethod = paymentDetails.method;
    payment.status = "success";
    payment.rawResponse = paymentDetails;

    await payment.save();

    /////////////////////////////////////////////////////////////
    // FIND STUDENT
    /////////////////////////////////////////////////////////////

    const student = await Student.findById(payment.student);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    /////////////////////////////////////////////////////////////
    // ENROLL STUDENT
    /////////////////////////////////////////////////////////////

    if (!student.enrolledCourses) {
      student.enrolledCourses = [];
    }

    const alreadyEnrolled = student.enrolledCourses.some(
      (e) => (e.course ? e.course.toString() : e.toString()) === payment.course.toString()
    );

    if (!alreadyEnrolled) {
      student.enrolledCourses.push({
        course: payment.course,
        progress: 0,
        completed: false
      });
      await student.save();
    }

    /////////////////////////////////////////////////////////////
    // RESPONSE
    /////////////////////////////////////////////////////////////

    res.json({
      message: "Payment verified and student enrolled successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Payment verification failed",
    });
  }
});

/////////////////////////////////////////////////////////////
// WEBHOOK
/////////////////////////////////////////////////////////////

router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", secret);

    shasum.update(JSON.stringify(req.body));

    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      return res.status(400).json({
        message: "Invalid webhook signature",
      });
    }

    const event = req.body;

    /////////////////////////////////////////////////////////////
    // PAYMENT SUCCESS
    /////////////////////////////////////////////////////////////

    if (event.event === "payment.captured") {
      const paymentId = event.payload.payment.entity.id;

      await Payment.findOneAndUpdate(
        { razorpayPaymentId: paymentId },
        { status: "success" }
      );
    }

    /////////////////////////////////////////////////////////////
    // PAYMENT FAILED
    /////////////////////////////////////////////////////////////

    if (event.event === "payment.failed") {
      const paymentId = event.payload.payment.entity.id;

      await Payment.findOneAndUpdate(
        { razorpayPaymentId: paymentId },
        { status: "failed" }
      );
    }

    res.json({
      status: "Webhook received",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Webhook error",
    });
  }
});

/////////////////////////////////////////////////////////////
// GET MY SUBSCRIPTIONS (For Student)
/////////////////////////////////////////////////////////////

router.get("/my-subscriptions", protect, async (req, res) => {
  try {
    let student;
    if (req.user.role === "student") {
      student = await Student.findOne({ user: req.user._id });
    } else if (req.user.role === "parent") {
      // Parents can see their children's subscriptions too if we wanted, 
      // but for now let's focus on the logged in student.
      return res.status(403).json({ message: "Not authorized as student" });
    }

    if (!student) {
      return res.status(404).json({ message: "Student record not found" });
    }

    const subscriptions = await Payment.find({
      student: student._id,
      type: "inward",
      status: "success"
    }).populate("course", "title thumbnail price category");

    res.json(subscriptions);
  } catch (error) {
    console.error("Fetch subscriptions error:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
});

const { generateReceiptPDF } = require("../utils/receiptGenerator");

router.get("/invoice/:id", protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("student", "studentNameEnglish email phone address")
      .populate("course", "title price category");

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    const data = {
      documentTitle: "TAX INVOICE",
      receiptNo: payment._id.toString().substring(0, 8).toUpperCase(),
      date: payment.createdAt,
      transactionId: payment.razorpayPaymentId || "MANUAL",
      billedTo: {
        name: payment.student?.studentNameEnglish || "Student",
        id: payment.student?._id.toString().substring(0, 8).toUpperCase(),
        email: payment.student?.email || "",
        phone: payment.student?.phone || ""
      },
      items: [
        {
          description: payment.course?.title || "Course Enrollment",
          qty: 1,
          amount: payment.amount
        }
      ],
      totalAmount: payment.amount,
      status: payment.status
    };

    generateReceiptPDF(res, data);

  } catch (error) {
    console.error("Invoice generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  }
});

module.exports = router;
