// ============================================================
// EVENT MODEL
// Defines the structure of calendar events in MongoDB.
// Each event belongs to a user (referenced by userId).
// ============================================================

const mongoose = require('mongoose');

/**
 * Event Schema
 */
const eventSchema = new mongoose.Schema(
  {
    // Reference to the user who owns this event
    // ObjectId is MongoDB's unique identifier type
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // References the User model
      required: true,
    },

    // Event title (e.g., "Team Meeting", "Doctor Appointment")
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    // Optional detailed description
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },

    // Event start date and time
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    // Event end date and time
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },

    // Color coding for the calendar UI
    color: {
      type: String,
      default: '#6366f1', // Default: Indigo
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'],
    },

    // Event category for filtering
    category: {
      type: String,
      enum: ['work', 'personal', 'health', 'education', 'other'],
      default: 'other',
    },

    // Whether this is an all-day event
    allDay: {
      type: Boolean,
      default: false,
    },

    // Event location (optional)
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
      default: '',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster queries (find all events for a user)
eventSchema.index({ userId: 1, startDate: 1 });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
