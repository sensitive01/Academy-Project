const mongoose = require("mongoose");

const centerSchema = new mongoose.Schema(
  {
    centerId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    location: String,
    description: String,
    cashBalance: {
      type: Number,
      default: 0,
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      upiId: String,
    },
  },
  { timestamps: true }
);

// 🔥 Auto-generate centerId
centerSchema.pre("save", function () {
  if (!this.centerId) {
    const year = new Date().getFullYear();

    const unique =
      Date.now().toString().slice(-4) +
      Math.floor(Math.random() * 100);

    this.centerId = `CEN-${year}-${unique}`;
  }
});

module.exports = mongoose.model("Center", centerSchema);