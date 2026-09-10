const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    contactPerson: String,
    mobile: String,
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    website: String,
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
