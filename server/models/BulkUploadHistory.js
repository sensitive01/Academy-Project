const mongoose = require('mongoose');

const bulkUploadHistorySchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: ['Students', 'Attendance', 'Payroll', 'Marks']
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Success', 'Partial', 'Failed'],
    default: 'Success'
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  successfulRecords: {
    type: Number,
    default: 0
  },
  failedRecords: {
    type: Number,
    default: 0
  },
  summary: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('BulkUploadHistory', bulkUploadHistorySchema);
