const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    batchId: {
      type: String,
      required: true,
      unique: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Center',
      required: true,
    },
    numberOfSemesters: {
      type: Number,
      required: true,
    },
    period: {
      startDate: { type: String, required: true },
      endDate: { type: String, required: true }
    },
    numberOfStudents: {
      type: Number,
      required: true,
    },
    semesters: [
      {
        semesterNumber: { type: Number, required: true },
        subjects: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
          }
        ]
      }
    ],
    certificateDate: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Batch", batchSchema);
