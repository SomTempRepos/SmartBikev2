
// src/middleware/rateLimiting.js - Rate Limiting Middleware
const Helpers = require('../utils/helper');
const logger = require('../utils/logger');

const rateLimitMiddleware = (maxRequests, windowMinutes) => {
  const requestCounts = new Map();
  const windowMs = windowMinutes * 60 * 1000;

  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [key, data] of requestCounts.entries()) {
      if (data.timestamp < windowStart) {
        requestCounts.delete(key);
      }
    }

    // Check current request count
    const currentData = requestCounts.get(identifier) || { count: 0, timestamp: now };
    
    if (currentData.timestamp < windowStart) {
      // Reset if outside window
      currentData.count = 1;
      currentData.timestamp = now;
    } else {
      currentData.count++;
    }

    requestCounts.set(identifier, currentData);

    if (currentData.count > maxRequests) {
      logger.warn(`Rate limit exceeded for ${identifier}: ${currentData.count}/${maxRequests}`);
      return res.status(429).json(
        Helpers.createErrorResponse(new Error(`Rate limit exceeded: ${maxRequests} requests per ${windowMinutes} minutes`))
      );
    }

    next();
  };
};

module.exports = {
  rateLimitMiddleware
};
