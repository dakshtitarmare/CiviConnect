const { db } = require('../config/firebase');
const { validationResult } = require('express-validator');

const generateIssueId = () => {
  const now = new Date();
  const id = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  return `IS-${id}`; // e.g. IS-20251101123045
};

const issueController = {
  // Report new issue
    // Report new issue
    async reportIssue(req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
  
        const { title, description, location, imageURL, citizenEmail, jurisdiction } = req.body;
        const issueId = generateIssueId();
        
        // Use the SAME sanitization as user controller - underscore for ALL special chars
        const sanitizedEmail = citizenEmail.replace(/[.#$\/\[\]]/g, '_');
        
        console.log('Looking for citizen with original email:', citizenEmail);
        console.log('Looking for citizen with sanitized email:', sanitizedEmail);
  
        // Check if citizen exists
        const citizenRef = db.ref('citizens').child(sanitizedEmail);
        const citizenSnapshot = await citizenRef.once('value');
  
        console.log('Citizen exists:', citizenSnapshot.exists());
        
        if (!citizenSnapshot.exists()) {
          return res.status(404).json({ 
            success: false, 
            error: 'Citizen not found',
            details: `No citizen found with email: ${citizenEmail} (looking for: ${sanitizedEmail})`
          });
        }
  
        // Create issue data
        const issueData = {
          id: issueId,
          title,
          description,
          location,
          imageURL,
          citizenEmail,
          jurisdiction,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
  
        // Save issue
        const issueRef = db.ref('issues').child(issueId);
        await issueRef.set(issueData);
  
        // Update citizen's total issues filed
        const citizenData = citizenSnapshot.val();
        await citizenRef.update({
          total_issue_filed: (citizenData.total_issue_filed || 0) + 1,
          updatedAt: Date.now()
        });
  
        res.status(201).json({
          success: true,
          message: 'Issue reported successfully',
          data: issueData
        });
      } catch (error) {
        console.error('Error reporting issue:', error);
        res.status(500).json({ success: false, error: 'Failed to report issue' });
      }
    },
  
    // Get issues by citizen email - also fix this
    async getIssuesByCitizen(req, res) {
      try {
        const { email } = req.params;
        
        // Don't sanitize here since we're querying by the original email field
        // The issues are stored with original email in citizenEmail field
        
        const issuesRef = db.ref('issues');
        const snapshot = await issuesRef.orderByChild('citizenEmail').equalTo(email).once('value');
        const issues = snapshot.val();
  
        const issuesList = issues ? Object.values(issues) : [];
  
        res.status(200).json({
          success: true,
          data: issuesList
        });
      } catch (error) {
        console.error('Error fetching citizen issues:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch citizen issues' });
      }
    },
  
  // Get all issues
  async getAllIssues(req, res) {
    try {
      const issuesRef = db.ref('issues');
      const snapshot = await issuesRef.once('value');
      const issues = snapshot.val();

      const issuesList = issues ? Object.values(issues) : [];

      res.status(200).json({
        success: true,
        data: issuesList
      });
    } catch (error) {
      console.error('Error fetching issues:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch issues' });
    }
  },

  // Get issue by ID
  async getIssueById(req, res) {
    try {
      const { id } = req.params;

      const issueRef = db.ref('issues').child(id);
      const snapshot = await issueRef.once('value');
      const issueData = snapshot.val();

      if (!issueData) {
        return res.status(404).json({ success: false, error: 'Issue not found' });
      }

      res.status(200).json({
        success: true,
        data: issueData
      });
    } catch (error) {
      console.error('Error fetching issue:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch issue' });
    }
  },

  // Get issues by citizen email
  async getIssuesByCitizen(req, res) {
    try {
      const { email } = req.params;
      const sanitizedEmail = email.replace('.', ',');

      const issuesRef = db.ref('issues');
      const snapshot = await issuesRef.orderByChild('citizenEmail').equalTo(email).once('value');
      const issues = snapshot.val();

      const issuesList = issues ? Object.values(issues) : [];

      res.status(200).json({
        success: true,
        data: issuesList
      });
    } catch (error) {
      console.error('Error fetching citizen issues:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch citizen issues' });
    }
  }
};

module.exports = issueController;