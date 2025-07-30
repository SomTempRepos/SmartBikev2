// src/app.js
const express = require('express');
const cors = require('cors');


const { corsOptions } = require('./middleware/cors');
const { authenticateJWT } = require('./middleware/auth');
const routes = require('./routes');
const { ensureDirectories } = require('./utils/fileManager');

const app = express();

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight
app.use(express.json());


// Ensure data directories exist
//ensureDirectories();

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = app;
