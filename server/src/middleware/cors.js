// src/middleware/cors.js
const { CORS_ORIGIN } = require('../config/environment');

const corsOptions = {
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(','),
  methods: ['GET', 'POST'],
  credentials: true,
};

module.exports = { corsOptions };
