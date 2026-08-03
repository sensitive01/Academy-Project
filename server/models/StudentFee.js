const mongoose = require('mongoose');

const studentFeeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
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
  feeType: {
    type: String,
    required: true,
    enum: ['Term', 'Exam', 'Other', 'Monthly']
  },
  otherFeeType: {
    type: String
  },
  terms: [{
    type: Number
  }],
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  
  // Penalty Tracking Fields
  dueDate: {
    type: Date
  },
  penaltyAmount: {
    type: Number,
    default: 0
  },
  finalDueDate: {
    type: Date
  },
  finalPenaltyAmount: {
    type: Number,
    default: 0
  },
  isPenaltyApplied: {
    type: Boolean,
    default: false
  },
  isFinalPenaltyApplied: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentFee', studentFeeSchema);
