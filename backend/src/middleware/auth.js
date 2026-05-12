// ============================================================
// JWT AUTHENTICATION MIDDLEWARE
// This middleware protects routes that require login.
//
// HOW JWT WORKS:
// 1. User logs in → Server creates a "token" with user ID inside
// 2. Token is sent to the browser
// 3. Browser sends token with every request in the Authorization header
// 4. This middleware checks the token is valid before allowing access
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * authMiddleware - Validates JWT token on protected routes
 * Usage: Add as middleware to any route that needs authentication
 * Example: router.get('/events', authMiddleware, getEvents)
 */
const authMiddleware = (req, res, next) => {
  // ---- STEP 1: Get the token from the request header ----
  // Token format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  // Extract the actual token (remove "Bearer " prefix)
  const token = authHeader.split(' ')[1];

  // ---- STEP 2: Verify the token ----
  try {
    // jwt.verify() checks:
    // - Token hasn't been tampered with (signature check)
    // - Token hasn't expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request object
    // Now any route handler can access req.user
    req.user = decoded;

    next(); // Token is valid, proceed to the route handler
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

module.exports = authMiddleware;
