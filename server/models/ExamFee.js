const mongoose = require('mongoose');

const examFeeSchema = new mongoose.Schema({
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  fee: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Prevent duplicate fees for the same center, course, and batch
examFeeSchema.index({ center: 1, course: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model('ExamFee', examFeeSchema);
