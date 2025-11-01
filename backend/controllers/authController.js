const { db } = require('../config/firebase');
const transporter = require('../config/email');
const { validationResult } = require('express-validator');

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const authController = {
  // Citizen OTP Send
  async sendCitizenOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const otp = generateOTP();

      // Store OTP in Firebase
      const otpRef = db.ref('otpVerifications');
      await otpRef.child('citizens').child(email.replace('.', ',')).set({
        otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      // Send OTP via email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Citizen Verification',
        text: `Your OTP is: ${otp}. It will expire in 10 minutes.`
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        email: email,
        otp: otp // Remove this in production
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ success: false, error: 'Failed to send OTP' });
    }
  },
  async sendIssueDetails(req, res) {
    try {
      const { email, issueId } = req.body;

      // Fetch issue details from Firebase
      const issueRef = db.ref('issues').child(issueId);
      const snapshot = await issueRef.once('value');
      const issueData = snapshot.val();

      if (!issueData) {
        return res.status(404).json({ success: false, error: 'Issue not found' });
      }

      // Compose email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `📋 Issue Report Confirmation - ${issueData.id}`,
        html: `
        <h2>🛠️ Issue Report Details</h2>
        <p>Thank you for reporting your issue. Here are the details:</p>

        <ul>
          <li><strong>Issue ID:</strong> ${issueData.id}</li>
          <li><strong>Title:</strong> ${issueData.title}</li>
          <li><strong>Description:</strong> ${issueData.description}</li>
          <li><strong>Location:</strong> ${issueData.location}</li>
          <li><strong>Jurisdiction:</strong> ${issueData.jurisdiction}</li>
          <li><strong>Status:</strong> ${issueData.status}</li>
          <li><strong>Reported On:</strong> ${new Date(issueData.createdAt).toLocaleString()}</li>
        </ul>

        <p><strong>We’ll notify you once there’s an update on your issue.</strong></p>
        <p>Best Regards,<br/>City Service Portal Team</p>
      `,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: 'Issue details sent successfully',
        email: email,
        issueId: issueId,
      });
    } catch (error) {
      console.error('Error sending issue details:', error);
      res.status(500).json({ success: false, error: 'Failed to send issue details' });
    }
  },

  // Citizen OTP Verify
  async verifyCitizenOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp } = req.body;
      console.log("email and otp got",email,otp);
      const sanitizedEmail = email.replace('.', ',');

      const otpRef = db.ref('otpVerifications/citizens').child(sanitizedEmail);
      const snapshot = await otpRef.once('value');
      const otpData = snapshot.val();

      if (!otpData) {
        return res.status(400).json({ success: false, error: 'OTP not found or expired' });
      }

      if (Date.now() > otpData.expiresAt) {
        await otpRef.remove();
        return res.status(400).json({ success: false, error: 'OTP expired' });
      }

      if (otpData.otp !== otp) {
        return res.status(400).json({ success: false, error: 'Invalid OTP' });
      }

      // OTP verified successfully
      await otpRef.remove();

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        email: email
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ success: false, error: 'Failed to verify OTP' });
    }
  },

  // Admin OTP Send
  async sendAdminOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const otp = generateOTP();

      // Store OTP in Firebase
      const otpRef = db.ref('otpVerifications');
      await otpRef.child('admins').child(email.replace('.', ',')).set({
        otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      // Send OTP via email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Admin Verification',
        text: `Your OTP is: ${otp}. It will expire in 10 minutes.`
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        email: email,
        otp: otp // Remove this in production
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ success: false, error: 'Failed to send OTP' });
    }
  },

  // Admin OTP Verify
  async verifyAdminOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp } = req.body;
      const sanitizedEmail = email.replace('.', ',');

      const otpRef = db.ref('otpVerifications/admins').child(sanitizedEmail);
      const snapshot = await otpRef.once('value');
      const otpData = snapshot.val();

      if (!otpData) {
        return res.status(400).json({ success: false, error: 'OTP not found or expired' });
      }

      if (Date.now() > otpData.expiresAt) {
        await otpRef.remove();
        return res.status(400).json({ success: false, error: 'OTP expired' });
      }

      if (otpData.otp !== otp) {
        return res.status(400).json({ success: false, error: 'Invalid OTP' });
      }

      // OTP verified successfully
      await otpRef.remove();

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        email: email
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ success: false, error: 'Failed to verify OTP' });
    }
  }
};

module.exports = authController;