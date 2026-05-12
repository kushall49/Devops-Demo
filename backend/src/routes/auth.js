// ============================================================
// AUTH ROUTES - /api/auth
// Handles user registration and login.
//
// ENDPOINTS:
//   POST /api/auth/register  - Create a new account
//   POST /api/auth/login     - Login and get JWT token
//   GET  /api/auth/me        - Get current user info (protected)
// ============================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { metrics } = require('../middleware/metrics');

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },           // Payload: what we store inside the token
    process.env.JWT_SECRET,   // Secret key to sign the token
    { expiresIn: '7d' }       // Token expires in 7 days
  );
};

// ============================================================
// POST /api/auth/register
// Creates a new user account
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    // Create the new user (password is hashed automatically by the model)
    const user = await User.create({ username, email, password });

    // Increment the user registration metric for Prometheus
    metrics.userRegistrations.inc();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// ============================================================
// POST /api/auth/login
// Logs in an existing user, returns JWT
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare password with hash stored in database
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login time (used for active users metric)
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Increment active users gauge
    metrics.activeUsers.inc();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ============================================================
// GET /api/auth/me  (PROTECTED)
// Returns the currently logged-in user's info
// ============================================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user is set by the authMiddleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
