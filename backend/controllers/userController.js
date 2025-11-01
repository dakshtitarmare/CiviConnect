const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');

const userController = {
  // Create new citizen
  async createCitizen(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone_no, dob, address, aadhar_no } = req.body;
      
      // Use underscore for ALL special characters, not just dot
      const sanitizedEmail = email.replace(/[.#$\/\[\]]/g, '_');
      
      console.log('Original email:', email);
      console.log('Sanitized email:', sanitizedEmail);

      // Check if citizen already exists
      const citizenRef = db.ref('citizens').child(sanitizedEmail);
      const snapshot = await citizenRef.once('value');

      if (snapshot.exists()) {
        return res.status(400).json({ success: false, error: 'Citizen already exists' });
      }

      // Create new citizen
      const citizenData = {
        name,
        email,
        phone_no,
        dob,
        address,
        aadhar_no,
        total_issue_filed: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await citizenRef.set(citizenData);

      res.status(201).json({
        success: true,
        message: 'Citizen created successfully',
        data: citizenData
      });
    } catch (error) {
      console.error('Error creating citizen:', error);
      res.status(500).json({ success: false, error: 'Failed to create citizen' });
    }
  },

  // Get citizen by email
  async getCitizenByEmail(req, res) {
    try {
      const { email } = req.params;
      
      // Use the SAME sanitization as create
      const sanitizedEmail = email.replace(/[.#$\/\[\]]/g, '_');

      const citizenRef = db.ref('citizens').child(sanitizedEmail);
      const snapshot = await citizenRef.once('value');
      const citizenData = snapshot.val();

      if (!citizenData) {
        return res.status(404).json({ success: false, error: 'Citizen not found' });
      }

      res.status(200).json({
        success: true,
        data: citizenData
      });
    } catch (error) {
      console.error('Error fetching citizen:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch citizen' });
    }
  }
};

module.exports = userController;