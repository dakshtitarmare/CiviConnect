const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Create new admin
router.post('/new',
  [
    // body('email').isEmail().normalizeEmail(),
    body('email'),
    body('officerName').notEmpty().trim(),
    body('aadhar_no').isLength({ min: 12, max: 12 }),
    body('department').notEmpty().trim()
  ],
  adminController.createAdmin
);

// Get admin by email
router.get('/:email', adminController.getAdminByEmail);

// Update issue status
router.put('/issue/:id/status',
  [
    body('status').isIn(['pending', 'solved', 'working']),
    body('adminEmail').isEmail().normalizeEmail()
  ],
  adminController.updateIssueStatus
);

module.exports = router;