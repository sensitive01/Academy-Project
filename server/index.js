const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const roleRoutes = require('./routes/roleRoutes');
const designationRoutes = require('./routes/designationRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const studentRoutes = require('./routes/studentRoutes');
const leaveRoutes = require("./routes/leaveRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payroll = require("./routes/payrollRoutes");
const parentRoutes = require("./routes/parentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const financeRoutes = require("./routes/financeRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const forumRoutes = require("./routes/forumRoutes");  
const expenseRoutes = require("./routes/expenseRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const centerRoutes = require("./routes/centerRoutes"); 
const vendorRoutes = require("./routes/vendorRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const publicAttendanceRoutes = require("./routes/publicAttendanceRoutes");
const otpRoutes = require("./routes/otpRoutes");



dotenv.config();
connectDB();

const app = express();

app.use(cors());

// 🔐 Razorpay Webhook RAW BODY (MUST BE BEFORE JSON)
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
);

// Normal JSON parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/students', studentRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payroll);
app.use("/api/parent", parentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard-stats", dashboardRoutes);
app.use("/api/centers", centerRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/public-attendance", publicAttendanceRoutes);
app.use("/api/otp", otpRoutes);



app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});