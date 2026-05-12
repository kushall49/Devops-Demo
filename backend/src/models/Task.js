// ============================================================
// TASK MODEL
// Defines the structure of tasks in MongoDB.
// Tasks are like to-do items linked to a user.
// ============================================================

const mongoose = require('mongoose');

/**
 * Task Schema
 */
const taskSchema = new mongoose.Schema(
  {
    // Reference to the user who owns this task
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Task title / description
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // Additional notes
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Whether the task has been completed
    completed: {
      type: Boolean,
      default: false,
    },

    // When the task was completed
    completedAt: {
      type: Date,
      default: null,
    },

    // Task priority level
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    // Due date for the task
    dueDate: {
      type: Date,
      default: null,
    },

    // Task category
    category: {
      type: String,
      enum: ['work', 'personal', 'health', 'education', 'other'],
      default: 'other',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user-specific task queries
taskSchema.index({ userId: 1, completed: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
