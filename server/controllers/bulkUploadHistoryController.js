const BulkUploadHistory = require('../models/BulkUploadHistory');

// @desc    Record a bulk upload history
// @route   POST /api/bulk-upload-history
// @access  Private (Admin, HR, Center)
const recordBulkUpload = async (req, res) => {
  try {
    const { module, totalRecords, successfulRecords, failedRecords, status, summary } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload the original file.' });
    }

    const history = await BulkUploadHistory.create({
      module,
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      status: status || 'Success',
      totalRecords: parseInt(totalRecords) || 0,
      successfulRecords: parseInt(successfulRecords) || 0,
      failedRecords: parseInt(failedRecords) || 0,
      summary
    });

    res.status(201).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get bulk upload history for a specific module
// @route   GET /api/bulk-upload-history/:module
// @access  Private
const getBulkUploadHistory = async (req, res) => {
  try {
    const { module } = req.params;
    
    const history = await BulkUploadHistory.find({ module })
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  recordBulkUpload,
  getBulkUploadHistory
};
