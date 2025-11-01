const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware - FIXED: Add body parser BEFORE routes
app.use(cors());
app.use(express.json()); // Remove limit for now to test
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/image', require('./routes/image'));
app.use('/api/issue', require('./routes/issue'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running successfully',
    timestamp: new Date().toISOString()
  });
});

// Test route to check body parsing
app.post('/api/test-body', (req, res) => {
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  res.json({ 
    receivedBody: req.body,
    contentType: req.headers['content-type']
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});