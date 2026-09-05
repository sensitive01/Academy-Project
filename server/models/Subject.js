const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Theory', 'Practical'],
      required: true,
      default: 'Theory'
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      default: 1
    },
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
