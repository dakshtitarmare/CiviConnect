const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');

const adminController = {
  // Create new admin
  async createAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, officerName, aadhar_no, department } = req.body;
      const sanitizedEmail = email.replace('.', ',');

      // Check if admin already exists
      const adminRef = db.ref('admins').child(sanitizedEmail);
      const snapshot = await adminRef.once('value');

      if (snapshot.exists()) {
        return res.status(400).json({ success: false, error: 'Admin already exists' });
      }

      // Create new admin
      const adminData = {
        email,
        officerName,
        aadhar_no,
        department,
        reports: {
          pending: 0,
          solved: 0,
          working: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await adminRef.set(adminData);

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: adminData
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      res.status(500).json({ success: false, error: 'Failed to create admin' });
    }
  },

  // Get admin by email
  async getAdminByEmail(req, res) {
    try {
      const { email } = req.params;
      const sanitizedEmail = email.replace('.', ',');

      const adminRef = db.ref('admins').child(sanitizedEmail);
      const snapshot = await adminRef.once('value');
      const adminData = snapshot.val();

      if (!adminData) {
        return res.status(404).json({ success: false, error: 'Admin not found' });
      }

      res.status(200).json({
        success: true,
        data: adminData
      });
    } catch (error) {
      console.error('Error fetching admin:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch admin' });
    }
  },

  // Update issue status
  async updateIssueStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status, adminEmail } = req.body;
      const sanitizedEmail = adminEmail.replace('.', ',');

      // Check if admin exists
      const adminRef = db.ref('admins').child(sanitizedEmail);
      const adminSnapshot = await adminRef.once('value');

      if (!adminSnapshot.exists()) {
        return res.status(404).json({ success: false, error: 'Admin not found' });
      }

      // Check if issue exists
      const issueRef = db.ref('issues').child(id);
      const issueSnapshot = await issueRef.once('value');
      const issueData = issueSnapshot.val();

      if (!issueData) {
        return res.status(404).json({ success: false, error: 'Issue not found' });
      }

      // Get old status
      const oldStatus = issueData.status;

      // Update issue status
      await issueRef.update({
        status,
        updatedAt: Date.now(),
        assignedAdmin: adminEmail
      });

      // Update admin reports count
      const adminData = adminSnapshot.val();
      const reports = adminData.reports || { pending: 0, solved: 0, working: 0 };

      // Decrement old status count
      if (reports[oldStatus] > 0) {
        reports[oldStatus]--;
      }

      // Increment new status count
      reports[status] = (reports[status] || 0) + 1;

      await adminRef.update({
        reports,
        updatedAt: Date.now()
      });

      res.status(200).json({
        success: true,
        message: 'Issue status updated successfully',
        data: { ...issueData, status }
      });
    } catch (error) {
      console.error('Error updating issue status:', error);
      res.status(500).json({ success: false, error: 'Failed to update issue status' });
    }
  }
};

module.exports = adminController;