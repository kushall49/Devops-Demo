// ============================================================
// EVENTS ROUTES - /api/events
// Full CRUD (Create, Read, Update, Delete) for calendar events.
//
// All routes are protected by authMiddleware (require JWT login).
//
// ENDPOINTS:
//   GET    /api/events          - Get all events for logged-in user
//   POST   /api/events          - Create a new event
//   PUT    /api/events/:id      - Update an event
//   DELETE /api/events/:id      - Delete an event
// ============================================================

const express = require('express');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/auth');
const { metrics } = require('../middleware/metrics');

const router = express.Router();

// Apply auth middleware to ALL routes in this file
// Every request must include a valid JWT token
router.use(authMiddleware);

// ============================================================
// GET /api/events
// Returns all events belonging to the logged-in user
// Can filter by month: ?month=2024-01 (YYYY-MM format)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { month, category } = req.query;

    // Build query: always filter by userId for security
    const query = { userId: req.user.id };

    // Optional: filter by month
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      query.startDate = {
        $gte: new Date(year, monthNum - 1, 1),   // Start of month
        $lt: new Date(year, monthNum, 1),          // Start of next month
      };
    }

    // Optional: filter by category
    if (category) query.category = category;

    const events = await Event.find(query).sort({ startDate: 1 });

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// ============================================================
// POST /api/events
// Creates a new calendar event
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { title, description, startDate, endDate, color, category, allDay, location } = req.body;

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required',
      });
    }

    // Ensure end date is after start date
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Create event with the logged-in user's ID
    const event = await Event.create({
      userId: req.user.id,
      title,
      description,
      startDate,
      endDate,
      color,
      category,
      allDay,
      location,
    });

    // 📊 Increment Prometheus counter for event creation
    metrics.eventsCreated.inc();

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
});

// ============================================================
// PUT /api/events/:id
// Updates an existing event
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    // Find the event AND verify it belongs to this user (security!)
    const event = await Event.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you do not have permission',
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'startDate', 'endDate', 'color', 'category', 'allDay', 'location'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();

    res.json({ success: true, message: 'Event updated!', event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

// ============================================================
// DELETE /api/events/:id
// Deletes an event
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id, // Ensure user can only delete their own events
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you do not have permission',
      });
    }

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

module.exports = router;
