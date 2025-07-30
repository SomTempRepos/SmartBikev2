// services/socketService.js
const geoFencingService = require('./geofencingService');
const { SOCKET_EVENTS } = require('../utils/constants');
const { logger, logSocketConnection } = require('../utils/logger');

// In-memory client tracking
const connectedClients = new Set();

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    logSocketConnection(socket.id, 'connected');
    connectedClients.add(socket.id);

    // Handle client request for geofence status
    socket.on(SOCKET_EVENTS.REQUEST_GEOFENCE_STATUS, async () => {
      try {
        const stats = geoFencingService.getStatistics();
        socket.emit(SOCKET_EVENTS.GEOFENCE_STATS, stats);
      } catch (error) {
        logger.error('Error sending geofence status via socket:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logSocketConnection(socket.id, 'disconnected');
      connectedClients.delete(socket.id);
    });
  });
}

// Utility to expose client count (used in /health)
function getClientCount() {
  return connectedClients.size;
}

module.exports = {
  setupSocketHandlers,
  getClientCount
};
