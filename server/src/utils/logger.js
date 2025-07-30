const winston = require('winston');
const path = require('path');
const env = require('../config/environment');

// Create logs directory
const logsDir = path.join(__dirname, '../../logs');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    format: env.isDevelopment ? consoleFormat : logFormat,
    level: env.isDevelopment ? 'debug' : 'info'
  })
];

// Add file transports in production
if (env.isProduction) {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

// Handle uncaught exceptions and rejections
if (env.isProduction) {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat
    })
  );
}

// Export logger with additional helper methods
module.exports = {
  logger,
  
  // Helper methods for common logging scenarios
  logBikeData: (bikeId, data) => {
    logger.info(`Bike data received from ${bikeId}: Speed=${data.avgSpeed}, Battery=${data.battery}%`);
  },
  
  logUserAction: (userId, action, details = '') => {
    logger.info(`User ${userId} performed ${action}${details ? ': ' + details : ''}`);
  },
  
  logGeofenceAlert: (bikeId, type, distance) => {
    logger.warn(`Geofence ${type} alert for bike ${bikeId}, distance: ${distance}m`);
  },
  
  logError: (error, context = '') => {
    logger.error(`${context ? context + ': ' : ''}${error.message}`, { stack: error.stack });
  },
  
  logSocketConnection: (socketId, action) => {
    logger.info(`Socket ${action}: ${socketId}`);
  }
};