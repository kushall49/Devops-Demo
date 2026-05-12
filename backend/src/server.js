// ============================================================
// MAIN SERVER FILE - Entry Point for the Backend
//
// This file:
//  1. Loads environment variables
//  2. Connects to MongoDB
//  3. Sets up Express middleware (CORS, JSON parsing, metrics)
//  4. Registers all route handlers
//  5. Exposes /metrics endpoint for Prometheus
//  6. Starts the HTTP server
//
// FLOW DIAGRAM:
//  Request → CORS → JSON Parser → Metrics Middleware
//           → Router (auth/events/tasks/health)
//           → Response
// ============================================================

// Load environment variables from .env file FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { register, metricsMiddleware } = require('./middleware/metrics');

// Import route handlers
const authRoutes   = require('./routes/auth');
const eventRoutes  = require('./routes/events');
const taskRoutes   = require('./routes/tasks');
const healthRoutes = require('./routes/health');

// ---- Initialize Express App ----
const app = express();
const PORT = process.env.PORT || 5000;

// ---- Connect to MongoDB ----
connectDB();

// ============================================================
// MIDDLEWARE SETUP
// Middleware = functions that run between request and response
// ============================================================

// 1. CORS - Allows frontend (different port) to call our API
//    Without this, browsers block cross-origin requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// 2. JSON Parser - Parses incoming JSON request bodies
//    Without this, req.body would be undefined
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Prometheus Metrics Middleware
//    Tracks every request automatically
app.use(metricsMiddleware);

// ============================================================
// ROUTES REGISTRATION
// Each route file handles a specific resource
// ============================================================
app.use('/api/auth',   authRoutes);    // Authentication: /api/auth/login, /api/auth/register
app.use('/api/events', eventRoutes);  // Calendar events: /api/events
app.use('/api/tasks',  taskRoutes);   // Task management: /api/tasks
app.use('/api/health', healthRoutes); // System health:   /api/health

// ============================================================
// ROOT ENDPOINT
// Quick API status check
// ============================================================
app.get('/', (req, res) => {
  res.json({
    message: '🗓️ Smart Calendar & Task Manager API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth:   '/api/auth',
      events: '/api/events',
      tasks:  '/api/tasks',
      health: '/api/health',
      metrics: '/metrics',
    },
    documentation: 'See README.md for full API documentation',
  });
});

// ============================================================
// PROMETHEUS METRICS ENDPOINT
// Prometheus scrapes this endpoint every 5 seconds
// Returns all metrics in Prometheus text format
// ============================================================
app.get('/metrics', async (req, res) => {
  try {
    // Set correct content type for Prometheus
    res.set('Content-Type', register.contentType);
    // Send all collected metrics
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// ============================================================
// 404 HANDLER
// Catches any requests to undefined routes
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// Catches any unhandled errors in route handlers
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ============================================================
// START SERVER
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for testing
module.exports = { app, server };
