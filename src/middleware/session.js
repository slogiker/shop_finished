// src/middleware/session.js
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name' }), // Replace with your MongoDB connection string and database name
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
});

module.exports = sessionMiddleware;