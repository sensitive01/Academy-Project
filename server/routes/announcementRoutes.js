const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const Announcement = require("../models/Announcement");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

/* =====================================================
   USERS BY ROLE
===================================================== */
router.get("/users-by-role/:role", protect, async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role: role.toLowerCase() }).select("name _id email");
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   MARK ALL AS READ
===================================================== */
router.patch("/mark-all", protect, async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const query = {
      $and: [
        {
          $or: [
            { targetRoles: { $in: [role, "all"] } },
            { targetUserId: req.user._id }
          ]
        },
        { startDate: { $lte: today } },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: todayStart } }
          ]
        }
      ]
    };

    await Announcement.updateMany(
      {
        ...query,
        "readBy.userId": { $ne: req.user._id },
      },
      {
        $push: {
          readBy: {
            userId: req.user._id,
            readAt: new Date(),
          },
        },
      }
    );

    res.json({
      success: true,
      message: "All marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


/* =====================================================
   UNREAD COUNT
===================================================== */
router.get("/unread/count", protect, async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const query = {
      $and: [
        {
          $or: [
            { targetRoles: { $in: [role, "all"] } },
            { targetUserId: req.user._id }
          ]
        },
        { startDate: { $lte: today } },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: todayStart } }
          ]
        }
      ]
    };

    const unread = await Announcement.countDocuments({
      ...query,
      "readBy.userId": { $ne: req.user._id },
    });

    res.json({
      success: true,
      unread,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


/* =====================================================
   CREATE ANNOUNCEMENT
===================================================== */
router.post("/", protect, upload.array("images", 5), async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    if (role !== "admin" && role !== "sub-admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin and sub-admin can create announcements",
      });
    }

    const { 
      title, 
      message, 
      targetRoles, 
      startDate, 
      endDate, 
      targetUserId,
      targetUserName 
    } = req.body;

    // targetRoles might come as a string (if single) or array from frontend
    let roles = [];
    if (targetRoles) {
      roles = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
    }

    if (!title?.trim() || !message?.trim() || (roles.length === 0 && !targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Title, message and a target (role or user) are required",
      });
    }

    const imageUrls = req.files ? req.files.map(f => f.path) : [];

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      images: imageUrls,
      targetRoles: targetUserId ? [] : roles.map((r) => r.toLowerCase()),
      targetUserId: targetUserId || null,
      targetUserName: targetUserName || "",
      startDate: startDate || new Date(),
      endDate: endDate || null,
      createdBy: {
        userId: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
    });

    res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


/* =====================================================
   UPDATE ANNOUNCEMENT
===================================================== */
router.patch("/:id", protect, upload.array("images", 5), async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    if (role !== "admin" && role !== "sub-admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin and sub-admin can update announcements",
      });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    const {
      title,
      message,
      targetRoles,
      startDate,
      endDate,
      targetUserId,
      targetUserName,
    } = req.body;

    let roles = [];
    if (targetRoles) {
      roles = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
    }

    if (!title?.trim() || !message?.trim() || (roles.length === 0 && !targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Title, message and a target (role or user) are required",
      });
    }

    const imageUrls = req.files ? req.files.map((f) => f.path) : null;

    announcement.title = title.trim();
    announcement.message = message.trim();
    announcement.targetRoles = targetUserId ? [] : roles.map((r) => r.toLowerCase());
    announcement.targetUserId = targetUserId || null;
    announcement.targetUserName = targetUserId ? (targetUserName || "") : "";
    announcement.startDate = startDate ? new Date(startDate) : announcement.startDate;
    announcement.endDate = endDate ? new Date(endDate) : null;
    if (imageUrls && imageUrls.length) {
      announcement.images = imageUrls;
    }

    await announcement.save();

    res.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});



/* =====================================================
   GET ANNOUNCEMENTS
===================================================== */
router.get("/", protect, async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    
    // Get today's date with time normalized as well
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let query = {
      $and: [
        {
          $or: [
            { targetRoles: { $in: [role, "all"] } },
            { targetUserId: req.user._id }
          ]
        },
        { startDate: { $lte: today } },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: todayStart } }
          ]
        }
      ]
    }; 

    // If Admin/Sub-Admin is in Management Page (not Dashboard ticker) or specifically wants all
    if (role === "admin" || role === "sub-admin") {
      if (req.query.all === "true") {
        query = {}; // See EVERYTHING
      } else {
        // If they are on the ticker (Dashboard), they probably should still only see what's active.
        // But many admins expect to see EVERYTHING they've published in the ticker too to verify?
        // No, ticker should be clean.
        
        // HOWEVER, admins should see all ACTIVE announcements regardless of targetRole
        // so they can verify what's live for students etc.
        query = {
          $and: [
            { startDate: { $lte: today } },
            {
              $or: [
                { endDate: { $exists: false } },
                { endDate: null },
                { endDate: { $gte: todayStart } }
              ]
            }
          ]
        };
      }
    }

    if (search.trim()) {
      const searchObj = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } },
        ],
      };
      if (query.$and) {
        query.$and.push(searchObj);
      } else {
        query = { ...query, ...searchObj };
      }
    }

    if (req.query.month && req.query.year) {
      const startOfMonth = new Date(req.query.year, req.query.month - 1, 1);
      const endOfMonth = new Date(req.query.year, req.query.month, 0, 23, 59, 59, 999);
      const monthQuery = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
      if (query.$and) {
        query.$and.push(monthQuery);
      } else {
        query = { ...query, ...monthQuery };
      }
    }

    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Announcement.countDocuments(query);

    res.json({
      success: true,
      page,
      total,
      pages: Math.ceil(total / limit),
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


/* =====================================================
   MARK SINGLE AS READ
===================================================== */
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    const alreadyRead = announcement.readBy.some(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        userId: req.user._id,
        readAt: new Date(),
      });
      await announcement.save();
    }

    res.json({
      success: true,
      message: "Marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


/* =====================================================
   PIN ANNOUNCEMENT
===================================================== */
router.patch("/:id/pin", protect, async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    if (role !== "admin" && role !== "sub-admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin and sub-admin can pin announcements",
      });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    res.json({
      success: true,
      message: announcement.isPinned ? "Pinned successfully" : "Unpinned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


/* =====================================================
   DELETE
===================================================== */
router.delete("/:id", protect, async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    if (role !== "admin" && role !== "sub-admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin and sub-admin can delete",
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


module.exports = router;
