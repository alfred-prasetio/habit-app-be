const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }

  cachedConnection = mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false, // fail fast instead of queuing ops against a dead connection
  });

  try {
    await cachedConnection;
    console.log('MongoDB connected...');
  } catch (err) {
    cachedConnection = null; // don't cache a failed connection - let the next request retry
    throw err;
  }

  return cachedConnection;
}

module.exports = { connectDB };