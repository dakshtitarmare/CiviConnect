const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const issueController = require('../controllers/issueController');

// Report new issue
router.post('/report',
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('location').notEmpty().trim(),
    body('imageURL').isURL(),
    body('citizenEmail').isEmail().normalizeEmail(),
    body('jurisdiction').notEmpty().trim()
  ],
  issueController.reportIssue
);

// Get all issues
router.get('/', issueController.getAllIssues);

// Get issue by ID
router.get('/:id', issueController.getIssueById);

// Get issues by citizen email
router.get('/citizen/:email', issueController.getIssuesByCitizen);

// router.post('/send-report', issueController.sendOtp);
module.exports = router;