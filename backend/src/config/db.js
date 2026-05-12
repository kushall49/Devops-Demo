// ============================================================
// DATABASE CONFIGURATION
// This file handles the MongoDB connection using Mongoose.
// Mongoose is an ODM (Object Data Modeling) library for MongoDB.
// ============================================================

const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 * Uses the MONGO_URI environment variable for the connection string.
 * In Docker Compose, this points to the MongoDB container.
 * 
 * Note: If connection fails, the server still runs but requests needing DB will fail
 */
const connectDB = async () => {
  try {
    // mongoose.connect() returns a promise - we await it
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options prevent deprecation warnings
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, log error but DON'T exit
    // This allows the server to run and health checks to work
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('⚠️ Server continuing without database (API calls requiring DB will fail)');
  }
};

module.exports = connectDB;

