const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware to log incoming requests
router.use((req, res, next) => {
  console.log('User Route - Body:', req.body);
  console.log('User Route - Headers:', req.headers['content-type']);
  next();
});

// Create new citizen
router.post('/new',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('phone_no').notEmpty().withMessage('Phone number is required'),
    body('aadhar_no').isLength({ min: 12, max: 12 }).withMessage('Aadhar must be 12 digits'),
    body('dob').notEmpty().withMessage('Date of birth is required'),
    body('address').notEmpty().withMessage('Address is required')
  ],
  userController.createCitizen
);

// Get citizen by email
router.get('/:email', userController.getCitizenByEmail);

module.exports = router;