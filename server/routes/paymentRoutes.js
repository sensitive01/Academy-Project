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

/////////////////////////////////////////////////////////////
// GENERATE INVOICE PDF
/////////////////////////////////////////////////////////////

router.get("/invoice/:id", protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("student", "studentNameEnglish email phone address")
      .populate("course", "title price category");

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const filename = `Invoice_${payment.razorpayPaymentId || payment._id}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // Colors & Fonts
    const primaryColor = '#0f172a'; // Slate-900
    const accentColor = '#3b82f6';  // Blue-500
    const textDark = '#1e293b';
    const textLight = '#64748b';
    const borderColor = '#e2e8f0';

    // Header / Logo area
    doc.fillColor(primaryColor)
      .fontSize(24).font('Helvetica-Bold')
      .text("DR ACADEMY", 50, 50);

    doc.fontSize(10).font('Helvetica')
      .fillColor(textLight)
      .text("Empowering Excellence in Education", 50, 80);

    // Invoice Header
    doc.fillColor(primaryColor)
      .fontSize(20).font('Helvetica-Bold')
      .text("TAX INVOICE", doc.page.width - 250, 50, { align: 'right' });

    doc.fontSize(10).font('Helvetica')
      .fillColor(textLight)
      .text(`Invoice No: INV-${payment._id.toString().substring(0, 8).toUpperCase()}`, doc.page.width - 250, 75, { align: 'right' })
      .text(`Date: ${new Date(payment.createdAt).toLocaleDateString('en-IN')}`, doc.page.width - 250, 90, { align: 'right' })
      .text(`Transaction ID: ${payment.razorpayPaymentId || 'MANUAL'}`, doc.page.width - 250, 105, { align: 'right' });

    doc.moveDown(3);

    // Bill To & Company Info
    const startY = 150;

    // Left: Bill To
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text("BILL TO:", 50, startY);
    doc.fontSize(10).font('Helvetica').fillColor(textDark);
    doc.text(payment.student?.studentNameEnglish || "Student", 50, startY + 20)
      .text(`ID: ${payment.student?._id.toString().substring(0, 8).toUpperCase()}`, 50, startY + 35)
      .text(payment.student?.email || "", 50, startY + 50)
      .text(payment.student?.phone || "", 50, startY + 65);

    // Right: Center/Company Info
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text("ISSUED BY:", 300, startY);
    doc.fontSize(10).font('Helvetica').fillColor(textDark);
    doc.text("DR Academy HQ", 300, startY + 20)
      .text("123 Education Lane, Knowledge Park", 300, startY + 35)
      .text("Chennai, Tamil Nadu - 600001", 300, startY + 50)
      .text("Contact: +91 98765 43210", 300, startY + 65);

    doc.moveDown(4);

    // Table Header
    const tableTop = 260;
    doc.rect(50, tableTop, doc.page.width - 100, 25).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text("Item Description", 60, tableTop + 7);
    doc.text("Qty", 350, tableTop + 7, { width: 50, align: 'center' });
    doc.text("Amount", 450, tableTop + 7, { width: 80, align: 'right' });

    // Table Row
    const rowY = tableTop + 35;
    doc.fillColor(textDark).font('Helvetica').fontSize(10);
    doc.text(`${payment.course?.title || 'Course Enrollment'}`, 60, rowY, { width: 280 });
    doc.text("1", 350, rowY, { width: 50, align: 'center' });
    doc.text(`INR ${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, rowY, { width: 80, align: 'right' });

    // Summary Lines
    const summaryY = rowY + 50;
    doc.moveTo(300, summaryY).lineTo(530, summaryY).lineWidth(0.5).strokeColor(borderColor).stroke();

    doc.fillColor(textLight).fontSize(10).text("Total Amount:", 300, summaryY + 20);
    doc.fillColor(primaryColor).font('Helvetica-Bold').text(`INR ${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, summaryY + 20, { width: 80, align: 'right' });

    // Amount in Words
    try {
      const words = toWords.toWords(payment.amount).replace(/-/g, ' ');
      doc.moveDown(3);
      doc.fillColor(textLight).fontSize(9).font('Helvetica-Oblique')
        .text(`Amount in words: Rupees ${words} only.`, 50, summaryY + 60);
    } catch (e) { }

    // Status Stamp
    if (payment.status === 'success') {
      doc.rect(50, summaryY + 100, 100, 40).lineWidth(2).strokeColor('#22c55e').stroke();
      doc.fillColor('#22c55e').fontSize(16).font('Helvetica-Bold').text("PAID", 50, summaryY + 112, { width: 100, align: 'center' });
    }

    // Footer
    doc.fontSize(8).fillColor(textLight)
      .text("This is an electronically generated invoice and does not require a physical signature.", 0, doc.page.height - 50, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error("Invoice generation error:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
});

module.exports = router;
