const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: [
        "leave_applied",
        "leave_approved",
        "leave_rejected",
        "payment_received",
        "registration_success",
        "attendance_marked",
        "expense_created",
        "expense_approved",
        "expense_rejected",
        "exam_created",
        "exam_updated",
        "fee_assigned",
        "fee_paid",
        "result_published"
      ],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    link: { type: String },
    entityId: { type: String },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);