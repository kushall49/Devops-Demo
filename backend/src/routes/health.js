// ============================================================
// HEALTH CHECK ROUTES - /api/health
// Used by load balancers, Docker, and the admin dashboard
// to check if the system is running correctly.
//
// These endpoints show:
//   - API status (is the server running?)
//   - Database status (is MongoDB connected?)
//   - Server uptime
//   - Memory usage
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const os = require('os');

const router = express.Router();

// Track server start time for uptime calculation
const serverStartTime = Date.now();

// ============================================================
// GET /api/health
// Basic health check - returns server status
// ============================================================
router.get('/', (req, res) => {
  // Calculate uptime in seconds
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  // Check MongoDB connection state
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';

  // Get memory usage from Node.js process
  const memUsage = process.memoryUsage();

  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      formatted: `${hours}h ${minutes}m ${seconds}s`,
    },
    services: {
      api: {
        status: 'healthy',
        message: 'API server is running normally',
      },
      database: {
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        connection: dbStatus,
        message: dbStatus === 'connected' ? 'MongoDB connected' : 'MongoDB connection issue',
      },
    },
    system: {
      platform: os.platform(),
      nodeVersion: process.version,
      memory: {
        // Convert bytes to MB for readability
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,       // Resident Set Size
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
      },
    },
  });
});

// ============================================================
// GET /api/health/ping
// Simple ping - just confirms the server is alive
// Used by Docker health checks
// ============================================================
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'pong', timestamp: Date.now() });
});

module.exports = router;
