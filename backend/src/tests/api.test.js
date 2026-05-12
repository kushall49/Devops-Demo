// ============================================================
// BACKEND API TESTS
// Using Jest + Supertest for API endpoint testing.
//
// Supertest lets us make HTTP requests to our Express app
// without actually starting a server on a port.
//
// Run with: npm test
// ============================================================

const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');

// ---- TEST DATA ----
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
};

let authToken = ''; // Store JWT token between tests

// ============================================================
// SETUP & TEARDOWN
// ============================================================

beforeAll(async () => {
  // Switch the shared mongoose connection to a clean test database.
  const testDbUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/smartcalendar_test';
  await mongoose.disconnect();
  await mongoose.connect(testDbUri);
});

afterAll(async () => {
  // Clean up test data and close connections
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  server.close();
});

// ============================================================
// AUTH TESTS
// ============================================================

describe('Authentication API', () => {
  
  test('POST /api/auth/register - should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.password).toBeUndefined(); // Password must NOT be returned
  });

  test('POST /api/auth/register - should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser); // Same user again

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - should login and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();

    // Save token for use in protected route tests
    authToken = res.body.token;
  });

  test('POST /api/auth/login - should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me - should return user info with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('GET /api/auth/me - should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

// ============================================================
// EVENTS TESTS
// ============================================================

describe('Events API', () => {
  let createdEventId = '';

  const testEvent = {
    title: 'Test Meeting',
    description: 'A test calendar event',
    startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endDate: new Date(Date.now() + 90000000).toISOString(),
    category: 'work',
  };

  test('POST /api/events - should create an event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testEvent);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.event.title).toBe(testEvent.title);
    createdEventId = res.body.event._id;
  });

  test('GET /api/events - should return user events', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeGreaterThan(0);
  });

  test('PUT /api/events/:id - should update an event', async () => {
    const res = await request(app)
      .put(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Meeting Title' });

    expect(res.statusCode).toBe(200);
    expect(res.body.event.title).toBe('Updated Meeting Title');
  });

  test('DELETE /api/events/:id - should delete an event', async () => {
    const res = await request(app)
      .delete(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ============================================================
// TASKS TESTS
// ============================================================

describe('Tasks API', () => {
  let createdTaskId = '';

  test('POST /api/tasks - should create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test Task', priority: 'high' });

    expect(res.statusCode).toBe(201);
    expect(res.body.task.completed).toBe(false);
    createdTaskId = res.body.task._id;
  });

  test('PUT /api/tasks/:id - should mark task as complete', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ completed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.task.completed).toBe(true);
    expect(res.body.task.completedAt).not.toBeNull();
  });

  test('GET /api/tasks/stats - should return task statistics', async () => {
    const res = await request(app)
      .get('/api/tasks/stats')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.stats).toHaveProperty('total');
    expect(res.body.stats).toHaveProperty('completed');
    expect(res.body.stats).toHaveProperty('pending');
  });
});

// ============================================================
// HEALTH CHECK TESTS
// ============================================================

describe('Health Check API', () => {
  test('GET /api/health - should return server health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('operational');
    expect(res.body.services).toHaveProperty('api');
    expect(res.body.services).toHaveProperty('database');
  });

  test('GET /api/health/ping - should respond with pong', async () => {
    const res = await request(app).get('/api/health/ping');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /metrics - should return Prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('smartcal_http_requests_total');
  });
});
