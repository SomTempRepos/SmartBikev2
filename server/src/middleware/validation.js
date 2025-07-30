
// src/middleware/validation.js - Validation Middleware
const Helpers = require('../utils/helper');
const logger = require('../utils/logger');

const validateBikeData = (req, res, next) => {
  try {
    const { bikeId, data } = req.body;

    // Required fields validation
    if (!bikeId || typeof bikeId !== 'string') {
      return res.status(400).json(
        Helpers.createErrorResponse(new Error('Valid bikeId is required'))
      );
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json(
        Helpers.createErrorResponse(new Error('Valid data object is required'))
      );
    }

    // Optional location validation
    if (data.location) {
      const { lat, lng } = data.location;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json(
          Helpers.createErrorResponse(new Error('Location lat and lng must be numbers'))
        );
      }

      // Coordinate range validation
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json(
          Helpers.createErrorResponse(new Error('Invalid coordinate ranges'))
        );
      }
    }

    // Optional speed validation
    if (data.avgSpeed !== undefined && (typeof data.avgSpeed !== 'number' || data.avgSpeed < 0)) {
      return res.status(400).json(
        Helpers.createErrorResponse(new Error('avgSpeed must be a non-negative number'))
      );
    }

    // Optional battery validation
    if (data.battery !== undefined && (typeof data.battery !== 'number' || data.battery < 0 || data.battery > 100)) {
      return res.status(400).json(
        Helpers.createErrorResponse(new Error('battery must be a number between 0 and 100'))
      );
    }

    next();
  } catch (error) {
    logger.error('Validation error in validateBikeData:', error);
    res.status(400).json(Helpers.createErrorResponse(error));
  }
};

const validatePaginationParams = (params) => {
  const { limit, offset } = params;
  
  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
    return { valid: false, error: 'Limit must be a number between 1 and 1000' };
  }

  if (isNaN(parsedOffset) || parsedOffset < 0) {
    return { valid: false, error: 'Offset must be a non-negative number' };
  }

  return { valid: true, limit: parsedLimit, offset: parsedOffset };
};

const validateESP32Connection = (req, res, next) => {
  try {
    const { endpoint, bikeId } = req.body;

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json(
        Helpers.createErrorResponse(new Error('Valid ESP32 endpoint is required'))
      );
    }

    // Basic URL validation
    try {
      new URL(endpoint);
    } catch (urlError) {
      return res.status(400).json(
        Helpers.createErrorResponse(new Error('Invalid endpoint URL format'))
      );
    }

    // Optional bikeId validation
    if (bikeId && typeof bikeId !== 'string') {
      return res.status(400).json(
        Helpers.createErrorResponse(new Error('bikeId must be a string if provided'))
      );
    }

    next();
  } catch (error) {
    logger.error('Validation error in validateESP32Connection:', error);
    res.status(400).json(Helpers.createErrorResponse(error));
  }
};

const rateLimitMiddleware = (maxRequests, windowMinutes) => {
  const requestCounts = new Map();
  const windowMs = windowMinutes * 60 * 1000;

  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
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
      return res.status(429).json(
        Helpers.createErrorResponse(new Error(`Rate limit exceeded: ${maxRequests} requests per ${windowMinutes} minutes`))
      );
    }

    next();
  };
};

module.exports = {
  validateBikeData,
  validatePaginationParams,
  validateESP32Connection,
  rateLimitMiddleware
};