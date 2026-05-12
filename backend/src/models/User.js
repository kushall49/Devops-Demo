// ============================================================
// USER MODEL
// Defines the structure of user data stored in MongoDB.
// Mongoose schemas are like "blueprints" for documents.
// ============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Defines fields, types, validations, and constraints
 */
const userSchema = new mongoose.Schema(
  {
    // Username: required, unique, trimmed of whitespace
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },

    // Email: required, unique, converted to lowercase
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    // Password: stored as a HASH (never plain text!)
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // Track last login time for "active users" metric
    lastLogin: {
      type: Date,
      default: null,
    },

    // User role for future admin features
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ---- PRE-SAVE HOOK ----
// This runs automatically BEFORE saving a user to the database
// It hashes the password so we never store plain text passwords
userSchema.pre('save', async function (next) {
  // Only hash if the password was changed (not on other updates)
  if (!this.isModified('password')) return next();

  // bcrypt.genSalt() creates a random "salt" to make hashes unique
  // 12 is the "cost factor" - higher = more secure but slower
  const salt = await bcrypt.genSalt(12);

  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ---- INSTANCE METHOD ----
// Custom method available on every User document
// Compares entered password with stored hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the model
// mongoose.model('User', userSchema) creates a 'users' collection in MongoDB
const User = mongoose.model('User', userSchema);
module.exports = User;
