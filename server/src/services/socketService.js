// src/services/socketService.js - Simple Socket Integration Service
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Set();
    this.isInitialized = false;
  }

  initialize(server) {
    try {
      // Only initialize if socket.io is available
      const socketIo = require('socket.io');
      
      this.io = socketIo(server, {
        cors: {
          origin: process.env.CORS_ORIGIN || "*",
          methods: ["GET", "POST"]
        }
      });

      this.io.on('connection', (socket) => {
        this.connectedClients.add(socket.id);
        logger.info(`Socket client connected: ${socket.id}`);

        socket.on('subscribe_bike', (bikeId) => {
          socket.join(`bike_${bikeId}`);
          logger.debug(`Client ${socket.id} subscribed to bike ${bikeId}`);
        });

        socket.on('unsubscribe_bike', (bikeId) => {
          socket.leave(`bike_${bikeId}`);
          logger.debug(`Client ${socket.id} unsubscribed from bike ${bikeId}`);
        });

        socket.on('disconnect', () => {
          this.connectedClients.delete(socket.id);
          logger.info(`Socket client disconnected: ${socket.id}`);
        });
      });

      this.isInitialized = true;
      logger.info('Socket service initialized successfully');
    } catch (error) {
      logger.warn('Socket.io not available, continuing without real-time features:', error.message);
      this.isInitialized = false;
    }
  }

  emitBikeDataUpdate(bikeId, data) {
    if (this.io && this.isInitialized) {
      try {
        this.io.to(`bike_${bikeId}`).emit('bike_data_update', {
          bikeId,
          ...data
        });
        logger.debug(`Emitted bike data update for ${bikeId}`);
      } catch (error) {
        logger.warn(`Failed to emit bike data update for ${bikeId}:`, error);
      }
    }
  }

  emitGeofenceViolation(bikeId, violationData) {
    if (this.io && this.isInitialized) {
      try {
        this.io.to(`bike_${bikeId}`).emit('geofence_violation', {
          bikeId,
          ...violationData,
          type: 'geofence_violation'
        });
        logger.info(`Emitted geofence violation for bike ${bikeId}`);
      } catch (error) {
        logger.warn(`Failed to emit geofence violation for ${bikeId}:`, error);
      }
    }
  }

  getConnectionStatus() {
    return {
      connected: this.io !== null && this.isInitialized,
      clients: this.connectedClients.size,
      initialized: this.isInitialized,
      timestamp: new Date().toISOString()
    };
  }

  // Fallback methods that work even without socket.io
  broadcastSystemMessage(message) {
    if (this.io && this.isInitialized) {
      try {
        this.io.emit('system_message', {
          message,
          timestamp: new Date().toISOString()
        });
        logger.info(`Broadcasted system message: ${message}`);
      } catch (error) {
        logger.warn('Failed to broadcast system message:', error);
      }
    }
  }
}

module.exports = new SocketService();