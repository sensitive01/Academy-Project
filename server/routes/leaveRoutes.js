const express = require("express");
const router = express.Router();
const Leave = require("../models/Leave");

const Notification = require("../models/Notification");
const multer = require("multer");
const path = require("path");
const { protect, admin } = require("../middleware/authMiddleware"); 
const User = require("../models/User");
const Student = require("../models/Student");
const Employee = require("../models/Employee");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// =================== APPLY LEAVE ===================
router.post("/apply", protect, upload.single("file"), async (req, res) => {
  try {
    const {
      mode,
      leaveType,
      reason,
      startDate,
      endDate,
      numDays,
      permissionDate,
      startTime,
      endTime,
      appliedFor, // New field from admin form
    } = req.body;

    if (!mode || !leaveType || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ===== VALIDATION =====
    if (mode === "leave") {
      if (!startDate || !endDate || !numDays) {
        return res.status(400).json({ message: "Leave fields required" });
      }
    }
    if (mode === "permission") {
      if (!permissionDate || !startTime || !endTime) {
        return res.status(400).json({ message: "Permission fields required" });
      }
    }

    // ===== LEAVE BALANCE CHECK FOR EMPLOYEES =====
    let targetUserId = req.user._id;
    let targetUserName = req.body.employeeName;

    if (appliedFor && req.user.role === "admin") {
      const targetUser = await User.findById(appliedFor);
      if (targetUser) {
        targetUserId = targetUser._id;
        targetUserName = targetUser.name || targetUserName;
      }
    }

    if (mode === "leave") {
      const employee = await Employee.findOne({ user: targetUserId });
      if (employee) {
        const leaveKeyMap = {
          "Privileged Leave": "privilegedLeave",
          "Sick Leave": "sickLeave",
          "Casual Leave": "casualLeave"
        };
        const leaveKey = leaveKeyMap[leaveType];
        
        if (leaveKey) {
          const maxAllowed = employee.leaveBalances ? employee.leaveBalances[leaveKey] : 0;
          
          // Filter by the month of the start date
          const targetStartDate = new Date(startDate);
          const startOfMonth = new Date(targetStartDate.getFullYear(), targetStartDate.getMonth(), 1);
          const endOfMonth = new Date(targetStartDate.getFullYear(), targetStartDate.getMonth() + 1, 0, 23, 59, 59, 999);

          // Calculate already applied (pending or approved) for THIS MONTH
          const existingLeaves = await Leave.find({
            userId: targetUserId,
            mode: "leave",
            leaveType: leaveType,
            status: { $in: ["pending", "approved"] },
            startDate: { $gte: startOfMonth, $lte: endOfMonth }
          });
          
          const alreadyAppliedCount = existingLeaves.reduce((acc, curr) => acc + (curr.numDays || 0), 0);
          
          if (alreadyAppliedCount + Number(numDays) > maxAllowed) {
            return res.status(400).json({ 
              message: "Leave limit reached so contact the administration" 
            });
          }
        }
      }
    }

    // ===== CREATE DATA =====
    const leave = new Leave({
      userId: targetUserId,  // Now stores as target ObjectId reference
      employeeName: targetUserName,
      mode,
      leaveType,
      reason,

      // Leave fields
      startDate: mode === "leave" ? new Date(startDate) : undefined,
      endDate: mode === "leave" ? new Date(endDate) : undefined,
      numDays: mode === "leave" ? Number(numDays) : undefined,

      // Permission fields
      permissionDate:
        mode === "permission" ? new Date(permissionDate) : undefined,
      startTime: mode === "permission" ? startTime : undefined,
      endTime: mode === "permission" ? endTime : undefined,

      fileUrl: req.file ? req.file.path : undefined,
    });

    await leave.save();

    // 🔥 NOTIFY ONLY ADMIN ABOUT NEW LEAVE APPLICATION
    const admins = await User.find({ role: "admin" });
    
    const notificationPromises = admins.map(recipient => 
      Notification.create({
        recipient: recipient._id,
        sender: req.user._id,
        type: "leave_applied",
        title: "New Leave Application",
        message: `${req.user.name} has applied for ${mode === "leave" ? "leave" : "permission"}.`,
        link: `/dashboard/leave-request?id=${leave._id}`,
        entityId: leave._id,
      })
    );

    // ✅ IF APPLICANT IS A STUDENT, ALSO NOTIFY THE PARENT
    // ? IF APPLICANT IS A STUDENT, ALSO NOTIFY THE PARENT
    const applicantUser = await User.findById(targetUserId);
    if (applicantUser && applicantUser.role === "student") {
      const student = await Student.findOne({ user: targetUserId });
      if (student && student.parent) {
        notificationPromises.push(
          Notification.create({
            recipient: student.parent,
            sender: req.user._id,
            type: "leave_applied",
            title: "Child's Leave Application",
            message: `Your child ${student.studentNameEnglish} has applied for ${mode === "leave" ? "leave" : "permission"}.`,
            link: `/dashboard/leave-request?id=${leave._id}`,
            entityId: leave._id,
          })
        );
      }
    }

    await Promise.all(notificationPromises);

    res.status(201).json({
      message:
        mode === "leave"
          ? "Leave applied successfully"
          : "Permission requested successfully",
      leave,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Helper function to append balances
async function appendLeaveBalances(leaves) {
  const allEmployees = await Employee.find({});
  const allActiveLeaves = await Leave.find({ status: { $in: ["pending", "approved"] }, mode: "leave" });

  const empMap = {};
  allEmployees.forEach(emp => {
    if (emp.user) empMap[emp.user.toString()] = emp;
  });

  const leaveStatsMap = {};
  allActiveLeaves.forEach(l => {
    if (!l.userId || !l.startDate) return;
    const leaveDate = new Date(l.startDate);
    const monthKey = `${leaveDate.getFullYear()}_${leaveDate.getMonth()}`;
    const key = `${l.userId.toString()}_${l.leaveType}_${monthKey}`;
    if (!leaveStatsMap[key]) leaveStatsMap[key] = { approved: 0, pending: 0 };
    if (l.status === 'approved') leaveStatsMap[key].approved += (l.numDays || 0);
    if (l.status === 'pending') leaveStatsMap[key].pending += (l.numDays || 0);
  });

  const leaveKeyMap = {
    "Privileged Leave": "privilegedLeave",
    "Sick Leave": "sickLeave",
    "Casual Leave": "casualLeave"
  };

  return leaves.map(leave => {
    let leaveBalanceInfo = null;
    if (leave.mode === "leave" && leave.userId && leave.startDate) {
      const emp = empMap[leave.userId.toString()];
      if (emp) {
        const leaveDate = new Date(leave.startDate);
        const monthKey = `${leaveDate.getFullYear()}_${leaveDate.getMonth()}`;
        const leaveKey = leaveKeyMap[leave.leaveType];
        if (leaveKey) {
          const maxAllowed = emp.leaveBalances ? (emp.leaveBalances[leaveKey] || 0) : 0;
          const stats = leaveStatsMap[`${leave.userId.toString()}_${leave.leaveType}_${monthKey}`] || { approved: 0, pending: 0 };
          const alreadyAppliedCount = stats.approved + stats.pending;
          leaveBalanceInfo = {
            maxAllowed,
            alreadyAppliedCount,
            approvedCount: stats.approved,
            pendingCount: stats.pending,
            remaining: maxAllowed - alreadyAppliedCount
          };
        }
      }
    }
    return { ...leave.toObject(), leaveBalanceInfo };
  });
}

// =================== GET ALL LEAVES (All Users) ===================
router.get("/all", protect, admin, async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    const leavesWithBalances = await appendLeaveBalances(leaves);
    res.json(leavesWithBalances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =================== GET SINGLE LEAVE BY ID ===================
router.get("/:id", protect, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    let leaveBalanceInfo = null;
    if (leave.mode === "leave") {
      const employee = await Employee.findOne({ user: leave.userId });
      if (employee) {
        const leaveKeyMap = {
          "Privileged Leave": "privilegedLeave",
          "Sick Leave": "sickLeave",
          "Casual Leave": "casualLeave"
        };
        const leaveKey = leaveKeyMap[leave.leaveType];
        
        if (leaveKey) {
          const maxAllowed = employee.leaveBalances ? employee.leaveBalances[leaveKey] : 0;
          
          const existingLeaves = await Leave.find({
            userId: leave.userId,
            mode: "leave",
            leaveType: leave.leaveType,
            status: { $in: ["pending", "approved"] }
          });
          
          const approvedCount = existingLeaves
            .filter(l => l.status === "approved")
            .reduce((acc, curr) => acc + (curr.numDays || 0), 0);

          const pendingCount = existingLeaves
            .filter(l => l.status === "pending")
            .reduce((acc, curr) => acc + (curr.numDays || 0), 0);
          
          const alreadyAppliedCount = approvedCount + pendingCount;
          
          leaveBalanceInfo = {
            maxAllowed,
            alreadyAppliedCount,
            approvedCount,
            pendingCount,
            remaining: maxAllowed - alreadyAppliedCount
          };
        }
      }
    }

    res.json({ ...leave.toObject(), leaveBalanceInfo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// =================== GET ALL LEAVES OF EMPLOYEE===================
router.get("/", protect, async (req, res) => {
  try {
    // Optional: only fetch leaves of logged-in user
    const leaves = await Leave.find({ userId: req.user._id });
    const leavesWithBalances = await appendLeaveBalances(leaves);
    res.json(leavesWithBalances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// =================== UPDATE LEAVE ===================
router.put("/:id", protect, upload.single("file"), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // Optional: only allow the owner to update
    if (leave.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this leave" });
    }

    const { reason, leaveType, startDate, endDate, numDays } = req.body;

    leave.reason = reason || leave.reason;
    leave.leaveType = leaveType || leave.leaveType;
    leave.startDate = startDate || leave.startDate;
    leave.endDate = endDate || leave.endDate;
    leave.numDays = numDays || leave.numDays;
    if (req.file) leave.fileUrl = req.file.path;

    await leave.save();
    res.json({ message: "Leave updated successfully", leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =================== DELETE LEAVE ===================
router.delete("/:id", protect, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // Delete without checking ownership
    await leave.deleteOne();
    res.json({ message: "Leave deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// =================== APPROVE / REJECT LEAVE (Admin only) ===================
router.patch("/:id/status", protect, admin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const leave = await Leave.findById(req.params.id).populate("userId");
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    leave.status = status;
    await leave.save();

    // Get applicant user details
    const applicant = await User.findById(leave.userId);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const notificationPromises = [];

    // ✅ 1. SEND NOTIFICATION TO THE APPLICANT (Student/Employee who applied)
    notificationPromises.push(
      Notification.create({
        recipient: leave.userId,
        sender: req.user._id,
        type: status === "approved" ? "leave_approved" : "leave_rejected",
        title: status === "approved" ? "Leave Approved" : "Leave Rejected",
        message: `Your ${leave.mode === "leave" ? "leave" : "permission"} request has been ${status}.`,
        link: `/dashboard/leave-request?id=${leave._id}`,
        entityId: leave._id,
      })
    );

    // ✅ 2. IF APPLICANT IS A STUDENT, ALSO NOTIFY THE PARENT
    if (applicant.role === "student") {
      const student = await Student.findOne({ user: leave.userId });
      if (student && student.parent) {
        notificationPromises.push(
          Notification.create({
            recipient: student.parent,
            sender: req.user._id,
            type: status === "approved" ? "leave_approved" : "leave_rejected",
            title: `Child's Leave ${status === "approved" ? "Approved" : "Rejected"}`,
            message: `Your child ${student.studentNameEnglish}'s ${leave.mode === "leave" ? "leave" : "permission"} request has been ${status}.`,
            link: `/dashboard/leave-request?id=${leave._id}`,
            entityId: leave._id,
          })
        );
      }
    }

    // Execute all notification promises
    await Promise.all(notificationPromises);

    res.json({ message: `Leave ${status} successfully and notifications sent to applicant${applicant.role === "student" ? " and parent" : ""}` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
