const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
  },
  theoryMark: {
    type: mongoose.Schema.Types.Mixed,
    default: 0,
  },
  internalMark: {
    type: mongoose.Schema.Types.Mixed,
    default: 0,
  },
  practicalMark: {
    type: mongoose.Schema.Types.Mixed,
    default: 0,
  },
  marksheetUrl: {
    type: String
  },
  template: {
    type: String,
    default: 'rg_modern'
  }
}, { timestamps: true });

module.exports = mongoose.model('Mark', markSchema);
