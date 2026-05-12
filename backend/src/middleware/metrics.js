// ============================================================
// PROMETHEUS METRICS MIDDLEWARE
// This file sets up all the metrics that Prometheus will scrape.
//
// HOW IT WORKS:
// 1. We define "counters" and "histograms" for tracking data
// 2. Express middleware updates these metrics on every request
// 3. Prometheus scrapes the /metrics endpoint every 5 seconds
// 4. Grafana reads from Prometheus and displays the data
// ============================================================

const client = require('prom-client');

// ---- STEP 1: Create a Registry ----
// A registry is a container for all our metrics
const register = new client.Registry();

// ---- STEP 2: Add Default Node.js Metrics ----
// This automatically tracks: CPU usage, Memory usage, Event loop lag, etc.
client.collectDefaultMetrics({
  register,
  prefix: 'smartcal_', // All default metrics will start with "smartcal_"
});

// ---- STEP 3: Define Custom Metrics ----

/**
 * COUNTER: Total HTTP Requests
 * Counters only go UP. Perfect for counting requests.
 * Labels allow us to filter by method (GET/POST) and route (/api/events)
 */
const httpRequestsTotal = new client.Counter({
  name: 'smartcal_http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * COUNTER: Failed API Requests
 * Tracks requests that resulted in 4xx or 5xx errors
 */
const httpRequestsFailed = new client.Counter({
  name: 'smartcal_http_requests_failed_total',
  help: 'Total number of failed HTTP requests (4xx and 5xx)',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * HISTOGRAM: Response Time (Latency)
 * Histograms track the distribution of values.
 * Perfect for measuring how long requests take.
 * Buckets: [50ms, 100ms, 200ms, 500ms, 1000ms, 2000ms, 5000ms]
 */
const httpResponseTime = new client.Histogram({
  name: 'smartcal_http_response_time_seconds',
  help: 'HTTP response time in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5], // time in seconds
  registers: [register],
});

/**
 * COUNTER: Events Created
 * Business metric - tracks how many calendar events were created
 */
const eventsCreated = new client.Counter({
  name: 'smartcal_events_created_total',
  help: 'Total number of calendar events created',
  registers: [register],
});

/**
 * COUNTER: Tasks Created
 * Business metric - tracks how many tasks were created
 */
const tasksCreated = new client.Counter({
  name: 'smartcal_tasks_created_total',
  help: 'Total number of tasks created',
  registers: [register],
});

/**
 * GAUGE: Active Users
 * Gauges can go up AND down. Perfect for tracking current state.
 */
const activeUsers = new client.Gauge({
  name: 'smartcal_active_users',
  help: 'Number of currently active users (logged in within last hour)',
  registers: [register],
});

/**
 * COUNTER: User Registrations
 */
const userRegistrations = new client.Counter({
  name: 'smartcal_user_registrations_total',
  help: 'Total number of user registrations',
  registers: [register],
});

// ---- STEP 4: Express Middleware ----
/**
 * This middleware runs on EVERY incoming request.
 * It starts a timer, then records metrics when the response is sent.
 */
const metricsMiddleware = (req, res, next) => {
  // Start timing this request
  const startTime = Date.now();

  // Listen for the response to finish
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record total requests
    httpRequestsTotal.inc({ method, route, status_code: statusCode });

    // Record failed requests (4xx client errors and 5xx server errors)
    if (res.statusCode >= 400) {
      httpRequestsFailed.inc({ method, route, status_code: statusCode });
    }

    // Record response time
    httpResponseTime.observe({ method, route }, duration);
  });

  next(); // Pass control to the next middleware/route handler
};

// Export everything we need
module.exports = {
  register,
  metricsMiddleware,
  // Export individual metrics so routes can increment them
  metrics: {
    eventsCreated,
    tasksCreated,
    activeUsers,
    userRegistrations,
    httpRequestsTotal,
    httpRequestsFailed,
  },
};
