const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Attendance = require('./models/Attendance');
const Employee = require('./models/Employee');
const User = require('./models/User');

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  console.log(`Checking date range: ${start.toISOString()} to ${end.toISOString()}`);
  
  const allAttendance = await Attendance.find();
  console.log(`Total attendance records: ${allAttendance.length}`);
  
  if (allAttendance.length > 0) {
    console.log('First 3 attendance records:');
    allAttendance.slice(0, 3).forEach(a => {
        console.log(`- userId: ${a.userId}, date: ${a.date.toISOString()}, name: ${a.name}`);
    });
  }

  const attendanceThisMonth = await Attendance.find({
    date: { $gte: start, $lte: end }
  });
  console.log(`Attendance this month: ${attendanceThisMonth.length}`);

  const activeEmployees = await Employee.find({ status: 'active' });
  console.log(`Active employees: ${activeEmployees.length}`);

  for (const emp of activeEmployees) {
    console.log(`Employee: ${emp.firstName} ${emp.lastName}, userId: ${emp.user}`);
  }

  process.exit();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
