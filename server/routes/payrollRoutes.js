const express = require("express");
const router = express.Router();
const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const { protect } = require("../middleware/authMiddleware");
const PDFDocument = require("pdfkit"); 
const toWords = require('number-to-words');

// GET ALL PAYROLLS
router.get("/salary/all", protect, async (req, res) => {
  try {
    const { month, year, internOnly } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month & year required" });
    }

    const m = Number(month);
    const y = Number(year);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);
    const totalDaysInMonth = endDate.getDate();

    let targetUsers = [];
    if (internOnly === "true") {
      const Student = require("../models/Student");
      const students = await Student.find({ status: "active", "internships.0": { $exists: true } }).populate("user");
      
      students.forEach(s => {
        const activeInternships = (s.internships || []).filter(internship => {
          if (internship.status !== 'active' && internship.status !== 'completed') return false;
          
          const iStart = new Date(internship.startDate);
          iStart.setHours(0, 0, 0, 0);
          
          const iEnd = internship.endDate ? new Date(internship.endDate) : null;
          if (iEnd) iEnd.setHours(23, 59, 59, 999);
          
          // Check overlap with current month (startDate to endDate)
          if (iStart > endDate) return false;
          if (iEnd && iEnd < startDate) return false;
          
          return true;
        });
        
        activeInternships.forEach(internship => {
          const salary = internship.salary ? Number(internship.salary) : 0;
          let overlapStart = new Date(Math.max(startDate.getTime(), new Date(internship.startDate).getTime()));
          overlapStart.setHours(0, 0, 0, 0);
          
          let overlapEnd = new Date(endDate);
          if (internship.endDate) {
            overlapEnd = new Date(Math.min(endDate.getTime(), new Date(internship.endDate).getTime()));
            overlapEnd.setHours(23, 59, 59, 999);
          }
          
          targetUsers.push({
            _id: s._id,
            user: s.user?._id,
            firstName: s.user?.name || s.studentNameEnglish,
            lastName: "",
            department: "Intern",
            salary: salary,
            shift: { start: "09:30" },
            isIntern: true,
            internshipId: internship._id,
            vendorName: internship.vendorName,
            overlapStart,
            overlapEnd
          });
        });
      });
    } else {
      targetUsers = await Employee.find({ status: "active" });
    }

    const data = await Promise.all(
      targetUsers.map(async (emp, index) => {
        const userId = emp.user;

        if (!userId) {
          return {
            sNo: index + 1,
            employeeId: emp._id,
            internshipId: emp.internshipId,
            vendorName: emp.vendorName,
            name: `${emp.firstName} ${emp.lastName}` + (emp.vendorName ? ` (${emp.vendorName})` : ""),
            department: emp.department,
            basic: emp.salary,
            allowances: 0,
            deductions: 0,
            advance: 0,
            totalDays: totalDaysInMonth,
            present: 0,
            absent: 0,
            lateDays: 0,
            lateTime: "0h 0m",
            netSalary: emp.salary,
            _id: null
          };
        }

        // 1. Fetch Payroll Record (for adjustments)
        const payrollQuery = {
          employee: emp._id,
          month: m,
          year: y
        };
        if (emp.internshipId) {
          payrollQuery.internshipId = emp.internshipId;
        } else {
          payrollQuery.internshipId = { $in: [null, undefined] };
        }
        
        const payroll = await Payroll.findOne(payrollQuery);

        // 2. Fetch Attendance Records
        const attStart = emp.overlapStart || startDate;
        const attEnd = emp.overlapEnd || endDate;
        
        const attendance = await Attendance.find({
          userId,
          date: { $gte: attStart, $lte: attEnd }
        });

        const present = attendance.length;

        // 3. Fetch Approved Leaves
        const leaves = await Leave.find({
          userId: userId.toString(),
          status: "approved",
          startDate: { $lte: attEnd },
          endDate: { $gte: attStart }
        });

        const absent = leaves.length;

        // 4. Calculate Late Days/Time
        let shiftStart = emp.shift?.start || "09:30"; 
        // Ensure shift start is in HH:mm:ss format
        if (shiftStart.split(":").length === 2) shiftStart += ":00";
        
        const shift = new Date(`1970-01-01T${shiftStart}`);

        let lateDays = 0;
        let totalLateMinutes = 0;

        attendance.forEach((record) => {
          if (!record.loginTime) return;
          const login = new Date(`1970-01-01T${record.loginTime}`);
          if (login > shift) {
            lateDays++;
            const diffMinutes = Math.floor((login - shift) / (1000 * 60));
            totalLateMinutes += diffMinutes;
          }
        });

        const lateHours = Math.floor(totalLateMinutes / 60);
        const lateMins = totalLateMinutes % 60;
        const lateTimeDisplay = `${lateHours}h ${lateMins}m`;

        // 5. Calculate Salary
        const allowances = payroll ? payroll.totalAllowances : 0;
        const deductions = payroll ? payroll.totalDeductions : 0;
        const advance = payroll ? payroll.advance : 0;

        const basic = payroll && payroll.basicSalary
          ? payroll.basicSalary
          : emp.salary;

        const netSalary = basic + allowances - deductions - advance;

        return {
          sNo: index + 1,
          employeeId: emp._id,
          internshipId: emp.internshipId,
          vendorName: emp.vendorName,
          name: `${emp.firstName} ${emp.lastName}`.trim() + (emp.vendorName ? ` (${emp.vendorName})` : ""),
          department: emp.department,
          basic: emp.salary,
          allowances,
          deductions,
          advance,
          adjustments: payroll && payroll.adjustments ? payroll.adjustments.map(a => ({
            type: a.type,
            amount: a.amount,
            note: a.note || "",
            createdAt: a.createdAt,
            _id: a._id
          })) : [],
          totalDays: totalDaysInMonth,
          present,
          absent,
          lateDays,
          lateTime: lateTimeDisplay,
          netSalary,
          status: payroll ? payroll.status : "processing",
          _id: payroll ? payroll._id : null
        };
      })
    );

    res.json(data);

  } catch (err) {
    console.error("Payroll GET error:", err);
    res.status(500).json({ message: err.message });
  }
});


// BULK UPDATE STATUS
router.post("/bulk-status", protect, async (req, res) => {
  try {
    const { records, month, year, status } = req.body;
    if (!records || !Array.isArray(records) || !month || !year || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["processing", "hold"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const { Student } = require("../models/Student"); // Need to fetch base salaries for missing payrolls

    for (const record of records) {
      const { employeeId, internshipId } = record;
      const query = { employee: employeeId, month: Number(month), year: Number(year) };
      if (internshipId) query.internshipId = internshipId;
      else query.internshipId = { $in: [null, undefined] };
      
      let payroll = await Payroll.findOne(query);
      
      if (!payroll) {
        // We need to create a default payroll record so we can persist the status
        let salary = 0;
        let employee = await Employee.findById(employeeId);
        
        if (employee) {
          salary = employee.salary;
        } else {
          const StudentModel = require("../models/Student");
          employee = await StudentModel.findById(employeeId);
          if (employee && employee.internships) {
             const internship = employee.internships.find(i => i._id.toString() === internshipId);
             if (internship) salary = internship.salary ? Number(internship.salary) : 0;
          } else if (employee) {
             const latestInternship = employee.internships?.[employee.internships.length - 1];
             salary = latestInternship?.salary ? Number(latestInternship.salary) : 0;
          }
        }

        if (employee) {
          payroll = new Payroll({
            employee: employeeId,
            month: Number(month),
            year: Number(year),
            internshipId: internshipId || null,
            basicSalary: salary,
            totalAllowances: 0,
            totalDeductions: 0,
            advance: 0,
            adjustments: [],
            status: status
          });
          // Note: we don't calculate netSalary, let it default or remain 0 since basic is salary
          payroll.netSalary = salary; 
          await payroll.save();
        }
      } else {
        payroll.status = status;
        await payroll.save();
      }
    }

    res.status(200).json({ message: `Successfully updated ${records.length} records to ${status}` });
  } catch (err) {
    console.error("Bulk status update error:", err);
    res.status(500).json({ message: err.message });
  }
});


// CREATE / UPDATE PAYROLL ADJUSTMENT
router.post("/adjustment", protect, async (req, res) => {
  try {

    const { employeeId, month, year, type, amount, note, internshipId } = req.body;

    if (!employeeId || !month || !year || !type || !amount) {
      return res.status(400).json({ message: "All fields required" });
    }

    const query = {
      employee: employeeId,
      month: Number(month),
      year: Number(year)
    };
    if (internshipId) query.internshipId = internshipId;
    else query.internshipId = { $in: [null, undefined] };

    let payroll = await Payroll.findOne(query);

    if (!payroll) {
      let salary = 0;
      let emp = await Employee.findById(employeeId);
      
      if (emp) {
        salary = emp.salary;
      } else {
        const Student = require("../models/Student");
        emp = await Student.findById(employeeId);
        if (emp && emp.internships) {
          const internship = emp.internships.find(i => i._id.toString() === internshipId);
          if (internship) salary = internship.salary ? Number(internship.salary) : 0;
          else {
            const latestInternship = emp.internships?.[emp.internships.length - 1];
            salary = latestInternship?.salary ? Number(latestInternship.salary) : 0;
          }
        }
      }

      if (!emp) {
        return res.status(404).json({ message: "Employee/Intern not found" });
      }

      payroll = new Payroll({
        employee: employeeId,
        month: Number(month),
        year: Number(year),
        internshipId: internshipId || null,
        basicSalary: salary,
        totalAllowances: 0,
        totalDeductions: 0,
        advance: 0,
        adjustments: []
      });
    }

    // Add adjustment
    payroll.adjustments.push({
      type,
      amount: Number(amount),
      note: note || ""
    });

    if (type === "allowance") payroll.totalAllowances += Number(amount);
    if (type === "deduction") payroll.totalDeductions += Number(amount);
    if (type === "advance") payroll.advance += Number(amount);

    payroll.netSalary =
      payroll.basicSalary +
      payroll.totalAllowances -
      payroll.totalDeductions -
      payroll.advance;

    await payroll.save();

    res.status(200).json({
      message: "Adjustment applied",
      payroll
    });

  } catch (err) {
    console.error("Payroll Adjustment Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// ✅ GENERATE PAYSLIP PDF
// ==============================
router.get('/payslip/:id', protect, async (req, res) => {
  try {
    const payrollRaw = await Payroll.findById(req.params.id);
    if (!payrollRaw) return res.status(404).json({ message: "Payroll not found" });
    
    let payroll = await Payroll.findById(req.params.id).populate('employee');
    let emp = payroll.employee;
    
    if (!emp) {
      const Student = require("../models/Student");
      const student = await Student.findById(payrollRaw.employee).populate('user');
      if (student) {
        let internDept = "Intern";
        if (student.internships && payrollRaw.internshipId) {
          const internship = student.internships.find(i => i._id.toString() === payrollRaw.internshipId.toString());
          if (internship && internship.vendorName) {
            internDept = `Intern (${internship.vendorName})`;
          }
        }
        
        emp = {
          _id: student._id,
          user: student.user?._id,
          firstName: student.user?.name || student.studentNameEnglish,
          lastName: "",
          department: internDept,
          shift: { start: "09:30" },
          internshipId: payrollRaw.internshipId
        };
      } else {
        return res.status(404).json({ message: "Employee/Intern not found for this payroll" });
      }
    }
    
    const userId = emp.user; // To fetch attendance

    // Recalculate Attendance precisely since it is not saved to Payroll model continuously
    const m = payroll.month;
    const y = payroll.year;
    
    let startDate = new Date(y, m - 1, 1);
    let endDate = new Date(y, m, 0, 23, 59, 59, 999);
    let totalDaysInMonth = endDate.getDate();
    
    if (emp.internshipId) {
       const Student = require("../models/Student");
       const s = await Student.findById(payrollRaw.employee);
       if (s && s.internships) {
          const internship = s.internships.find(i => i._id.toString() === emp.internshipId.toString());
          if (internship) {
            const iStart = new Date(internship.startDate);
            iStart.setHours(0,0,0,0);
            if (iStart > startDate) startDate = iStart;
            
            if (internship.endDate) {
               const iEnd = new Date(internship.endDate);
               iEnd.setHours(23,59,59,999);
               if (iEnd < endDate) endDate = iEnd;
            }
            
            // Calculate days for the internship portion of the month
            const diffTime = Math.abs(endDate - startDate);
            totalDaysInMonth = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
       }
    }

    let present = 0;
    let absent = 0;
    let lateDays = 0;
    let lateTimeDisplay = "0h 0m";

    if (userId) {
      const attendance = await Attendance.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      });
      present = attendance.length;

      const leaves = await Leave.find({
        userId: userId.toString(),
        status: "approved",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      });
      absent = leaves.length;

      let shiftStart = emp.shift?.start || "09:30"; 
      if (shiftStart.split(":").length === 2) shiftStart += ":00";
      const shift = new Date(`1970-01-01T${shiftStart}`);

      let totalLateMinutes = 0;
      attendance.forEach((record) => {
        if (!record.loginTime) return;
        const login = new Date(`1970-01-01T${record.loginTime}`);
        if (login > shift) {
          lateDays++;
          const diffMinutes = Math.floor((login - shift) / (1000 * 60));
          totalLateMinutes += diffMinutes;
        }
      });
      const lateHours = Math.floor(totalLateMinutes / 60);
      const lateMins = totalLateMinutes % 60;
      lateTimeDisplay = `${lateHours}h ${lateMins}m`;
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Payslip_${emp.firstName}_${emp.lastName}_${m}_${y}.pdf`
    );
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // ===============================
    // COLORS & FONTS SETUP
    // ===============================
    const primaryColor = '#1e3a8a'; // Blue-900
    const secondaryColor = '#475569'; // Slate-600
    const accentColor = '#e2e8f0'; // Slate-200
    const textDark = '#0f172a';
    const textLight = '#64748b';
    
    // ===============================
    // HEADER (Company Info)
    // ===============================
    doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
    
    doc.fillColor('#ffffff')
       .fontSize(28).font('Helvetica-Bold')
       .text("DR ACADEMY", 50, 35);
       
    doc.fontSize(10).font('Helvetica')
       .opacity(0.8)
       .text("Official Employee Payslip", 50, 65)
       .opacity(1);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[m - 1];

    let payslipPeriod = `Payslip for ${monthName} ${y}`;
    if (emp.internshipId) {
      const sDateStr = startDate.getDate().toString().padStart(2, '0') + '-' + monthNames[startDate.getMonth()].substring(0,3);
      const eDateStr = endDate.getDate().toString().padStart(2, '0') + '-' + monthNames[endDate.getMonth()].substring(0,3);
      if (startDate.getDate() !== 1 || endDate.getDate() !== new Date(y, m, 0).getDate()) {
         payslipPeriod = `${monthName} ${y} (${sDateStr} to ${eDateStr})`;
      }
    }

    doc.fillColor('#ffffff')
       .fontSize(14).font('Helvetica-Bold')
       .text(payslipPeriod, doc.page.width - 250, 45, { align: 'right' });

    // ===============================
    // EMPLOYEE DETAILS SECTION
    // ===============================
    doc.moveDown(4);
    let topY = Math.max(doc.y, 120);

    // Box around employee details
    doc.rect(50, topY, doc.page.width - 100, 90)
       .lineWidth(1).strokeColor(accentColor).stroke();

    doc.fillColor(textDark)
       .fontSize(13).font('Helvetica-Bold')
       .text("Employee Information", 65, topY + 15);

    doc.fontSize(10).font('Helvetica').fillColor(textLight);
    
    // Left column info
    doc.text("Name:", 65, topY + 40)
       .text("Employee ID:", 65, topY + 60);

    // Right column info
    const midX = doc.page.width / 2;
    doc.text("Department:", midX, topY + 40)
       .text("Designation:", midX, topY + 60);

    // Values (Dark details)
    doc.fillColor(textDark).font('Helvetica-Bold');
    doc.text(`${emp.firstName} ${emp.lastName}`, 145, topY + 40)
       .text(emp.empId || payroll._id.toString().substring(0,8).toUpperCase(), 145, topY + 60)
       .text((emp.department || '-').toUpperCase(), midX + 80, topY + 40)
       .text((emp.position || '-').toUpperCase(), midX + 80, topY + 60);


    // ===============================
    // ATTENDANCE SUMMARY SECTION
    // ===============================
    topY += 110;
    doc.rect(50, topY, doc.page.width - 100, 65)
       .lineWidth(1).strokeColor(accentColor).stroke();

    doc.fillColor(textDark)
       .fontSize(11).font('Helvetica-Bold')
       .text("Attendance & Time Tracking", 65, topY + 10);
    
    doc.fontSize(9).font('Helvetica').fillColor(textLight);
    doc.text("Total Days:", 65, topY + 30)
       .text("Present:", 165, topY + 30)
       .text("Leaves/Absent:", 265, topY + 30)
       .text("Late Days:", 375, topY + 30)
       .text("Total Late Hrs:", 455, topY + 30);

    doc.fillColor(textDark).font('Helvetica-Bold');
    doc.text(totalDaysInMonth.toString(), 65, topY + 45)
       .text(present.toString(), 165, topY + 45)
       .text(absent.toString(), 265, topY + 45)
       .text(lateDays.toString(), 375, topY + 45)
       .text(lateTimeDisplay, 455, topY + 45);

    // ===============================
    // SALARY BREAKDOWN TABLE
    // ===============================
    topY += 95;

    // Table Header
    doc.rect(50, topY, doc.page.width - 100, 25).fill(accentColor);
    doc.fillColor(textDark).fontSize(10).font('Helvetica-Bold');
    doc.text("Earnings", 60, topY + 7, { width: 200 })
       .text("Amount (INR)", 210, topY + 7, { width: 80, align: 'right' })
       .text("Deductions", 310, topY + 7, { width: 150 })
       .text("Amount (INR)", 450, topY + 7, { width: 80, align: 'right' });

    let currentY = topY + 35;

    const earnings = [
      { name: 'Basic Salary', amount: payroll.basicSalary },
      { name: 'Allowances (Total)', amount: payroll.totalAllowances },
    ];

    const deductions = [
      { name: 'Deductions (Total)', amount: payroll.totalDeductions },
      { name: 'Advance Pay', amount: payroll.advance },
    ];

    // Filter adjustments out to show individual ones if preferred, but they are summarized in totals in Payroll Schema
    // We will show the generalized details here.

    doc.font('Helvetica').fontSize(10);
    const tableRows = Math.max(earnings.length, deductions.length);
    let totalEarning = 0;
    let totalDeduction = 0;

    for (let i = 0; i < tableRows; i++) {
      const e = earnings[i];
      const d = deductions[i];

      if (e) totalEarning += e.amount;
      if (d) totalDeduction += d.amount;

      // Ensure alternating colors if we had many rows, but we use lines here instead
      doc.fillColor(textDark);
      if (e) {
        doc.text(e.name, 60, currentY);
        doc.text(e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 210, currentY, { width: 80, align: 'right' });
      }
      if (d) {
        doc.text(d.name, 310, currentY);
        doc.text(d.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 450, currentY, { width: 80, align: 'right' });
      }
      currentY += 20;
    }

    // Add a border below the items
    currentY += 5;
    doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).lineWidth(1).strokeColor(accentColor).stroke();

    // ===============================
    // TOTALS ROW
    // ===============================
    currentY += 10;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(textDark);
    doc.text("Gross Earnings", 60, currentY);
    doc.text(totalEarning.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 210, currentY, { width: 80, align: 'right' });
    
    doc.text("Total Deductions", 310, currentY);
    doc.text(totalDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 450, currentY, { width: 80, align: 'right' });

    // ===============================
    // NET PAY BLOCK
    // ===============================
    currentY += 40;
    
    doc.rect(doc.page.width - 250, currentY, 200, 35)
       .fill('#1e40af'); // blue-800
    
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold');
    doc.text("Net Salary :", doc.page.width - 240, currentY + 11);
    doc.text("₹ " + payroll.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 }), doc.page.width - 150, currentY + 11, { width: 90, align: 'right' });

    // Amount in words
    try {
      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Oblique');
      doc.text(`Amount in words: Rupees ${toWords.toWords(payroll.netSalary).replace(/-/g, ' ')} only.`, 50, currentY + 14);
    } catch (e) {
      // Ignore if number-to-words is not robust enough
    }

    // ===============================
    // FOOTER (Signatures & Notes)
    // ===============================
    currentY += 100;

    doc.moveTo(50, currentY).lineTo(200, currentY).strokeColor(secondaryColor).stroke();
    doc.moveTo(doc.page.width - 200, currentY).lineTo(doc.page.width - 50, currentY).stroke();

    currentY += 10;
    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica');
    doc.text("Employer Signature", 50, currentY, { width: 150, align: 'center' });
    doc.text("Employee Signature", doc.page.width - 200, currentY, { width: 150, align: 'center' });

    doc.moveDown(4);
    doc.fontSize(8).fillColor('#94a3b8')
       .text("This is a computer-generated document. No signature is required for official purposes.", 0, doc.page.height - 50, { align: "center" });

    doc.end();

  } catch (err) {
    console.error("Payslip generation error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

