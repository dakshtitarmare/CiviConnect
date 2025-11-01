const express = require('express');
const multer = require('multer');
const router = express.Router();
const imageController = require('../controllers/imageController');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload image
router.post('/upload', upload.single('image'), imageController.uploadImage);

module.exports = router;