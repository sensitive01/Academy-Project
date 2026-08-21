const mongoose = require("mongoose");


const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    batchId: {
      type: String,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    centers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Center',
      }
    ],
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
      default: 0,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }
    ],
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
