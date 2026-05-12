// ============================================================
// TASKS ROUTES - /api/tasks
// Full CRUD for task management.
//
// ENDPOINTS:
//   GET    /api/tasks          - Get all tasks for logged-in user
//   POST   /api/tasks          - Create a new task
//   PUT    /api/tasks/:id      - Update a task (edit or mark complete)
//   DELETE /api/tasks/:id      - Delete a task
//   GET    /api/tasks/stats    - Get task statistics for dashboard
// ============================================================

const express = require('express');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');
const { metrics } = require('../middleware/metrics');

const router = express.Router();

// Protect all task routes with JWT auth
router.use(authMiddleware);

// ============================================================
// GET /api/tasks/stats
// Returns dashboard statistics: total, completed, pending
// NOTE: This MUST come before /:id route to avoid ID conflict
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, completed, highPriority] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, completed: true }),
      Task.countDocuments({ userId, priority: 'high', completed: false }),
    ]);

    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending: total - completed,
        highPriority,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ============================================================
// GET /api/tasks
// Returns all tasks for the logged-in user
// Query params: ?completed=true/false, ?priority=high/medium/low
// ============================================================
router.get('/', async (req, res) => {
  try {
    const query = { userId: req.user.id };

    // Optional filters
    if (req.query.completed !== undefined) {
      query.completed = req.query.completed === 'true';
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

// ============================================================
// POST /api/tasks
// Creates a new task
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate, category } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const task = await Task.create({
      userId: req.user.id,
      title,
      description,
      priority,
      dueDate,
      category,
    });

    // 📊 Track task creation in Prometheus
    metrics.tasksCreated.inc();

    res.status(201).json({ success: true, message: 'Task created!', task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
});

// ============================================================
// PUT /api/tasks/:id
// Update task - also handles marking complete/incomplete
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // If marking as complete, record the completion time
    if (req.body.completed === true && !task.completed) {
      req.body.completedAt = new Date();
    }

    // If un-marking as complete, clear completion time
    if (req.body.completed === false) {
      req.body.completedAt = null;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true } // 'new: true' returns the updated document
    );

    res.json({ success: true, message: 'Task updated!', task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

// ============================================================
// DELETE /api/tasks/:id
// Deletes a task
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
});

module.exports = router;
