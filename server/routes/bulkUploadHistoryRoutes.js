const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { recordBulkUpload, getBulkUploadHistory, deleteBulkUploadHistory } = require('../controllers/bulkUploadHistoryController');

router.route('/')
  .post(protect, upload.single('file'), recordBulkUpload);

router.route('/:module')
  .get(protect, getBulkUploadHistory);

router.route('/:id')
  .delete(protect, deleteBulkUploadHistory);

module.exports = router;
