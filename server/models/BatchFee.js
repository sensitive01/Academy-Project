const mongoose = require('mongoose');

const batchFeeSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  centers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    required: true
  }],
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }],
  admissionFee: {
    type: Number,
    required: true
  },
  scholarshipFee: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('BatchFee', batchFeeSchema);
