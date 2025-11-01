const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// Citizen OTP Send
router.post('/citizen/send-otp', 
  [
    body('email').isEmail().normalizeEmail()
  ],
  authController.sendCitizenOTP
);

// Citizen OTP Verify
router.post('/citizen/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 4, max: 6 })
  ],
  authController.verifyCitizenOTP
);

// Admin OTP Send
router.post('/admin/send-otp',
  [
    body('email').isEmail().normalizeEmail()
  ],
  authController.sendAdminOTP
);

// Admin OTP Verify
router.post('/admin/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 4, max: 6 })
  ],
  authController.verifyAdminOTP
);
router.post('/send-issue-details', authController.sendIssueDetails);

module.exports = router;