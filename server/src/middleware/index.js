
// src/middleware/index.js - Middleware Index File
const { validateBikeData, validatePaginationParams, validateESP32Connection } = require('./validation');
const { rateLimitMiddleware } = require('./rateLimiting');
const authMiddleware = require('./auth');

module.exports = {
  validateBikeData,
  validatePaginationParams,
  validateESP32Connection,
  rateLimitMiddleware,
  authMiddleware
};