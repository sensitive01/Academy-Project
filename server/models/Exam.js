const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  centers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
  }],
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    totalMark: { type: Number, default: 100 },
    passMark: { type: Number, default: 35 },
    internalMark: { type: Number, default: 0 },
    externalMark: { type: Number, default: 0 },
    theoryMark: { type: Number, default: 0 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
