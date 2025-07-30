// src/controllers/geofenceController.js
const geoFencingService = require('../services/geofencingService');
const logger = require('../utils/logger');

class GeofenceController {
  
  // Get all bikes with geo-fence status
  async getBikes(req, res) {
    try {
      const bikes = geoFencingService.getBikes();
      
      res.json({
        success: true,
        data: {
          bikes,
          count: bikes.length,
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`Retrieved ${bikes.length} bikes for geo-fence API`);
    } catch (error) {
      logger.error('Error fetching bikes for geo-fence:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bike data',
        message: error.message
      });
    }
  }

  // Get geo-fence statistics
  async getStats(req, res) {
    try {
      const stats = geoFencingService.getStats();
      
      res.json({
        success: true,
        data: stats
      });

      logger.info('Retrieved geo-fence statistics');
    } catch (error) {
      logger.error('Error fetching geo-fence stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch geo-fence statistics',
        message: error.message
      });
    }
  }

  // Get all active sessions
  async getSessions(req, res) {
    try {
      const sessions = geoFencingService.getAllSessions();
      
      res.json({
        success: true,
        data: {
          sessions,
          count: sessions.length,
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`Retrieved ${sessions.length} active geo-fence sessions`);
    } catch (error) {
      logger.error('Error fetching geo-fence sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session data',
        message: error.message
      });
    }
  }

  // Get session-specific configuration
  async getSessionConfig(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required'
        });
      }

      const config = geoFencingService.getSessionConfig(sessionId);
      
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        data: {
          sessionId,
          config,
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`Retrieved config for session ${sessionId}`);
    } catch (error) {
      logger.error(`Error fetching session config for ${req.params.sessionId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session configuration',
        message: error.message
      });
    }
  }

  // Get bikes for a specific session
  async getBikesForSession(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required'
        });
      }

      const bikes = geoFencingService.getBikesForSession(sessionId);
      
      res.json({
        success: true,
        data: {
          sessionId,
          bikes,
          count: bikes.length,
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`Retrieved ${bikes.length} bikes for session ${sessionId}`);
    } catch (error) {
      logger.error(`Error fetching bikes for session ${req.params.sessionId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bikes for session',
        message: error.message
      });
    }
  }

  // Test ESP32 connectivity
  async testESP32Connection(req, res) {
    try {
      const { endpoint, bikeId = 'TEST_BIKE' } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({
          success: false,
          error: 'ESP32 endpoint is required'
        });
      }

      // Send test alert to ESP32
      const result = await geoFencingService.sendAlertToESP32(bikeId, {
        status: 'ok',
        message: 'test connection',
        distance: '0.00',
        timestamp: new Date().toLocaleTimeString()
      }, endpoint);

      res.json({
        success: result.success,
        data: {
          endpoint,
          bikeId,
          result,
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`ESP32 connection test completed for ${endpoint}`, result);
    } catch (error) {
      logger.error('Error testing ESP32 connection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test ESP32 connection',
        message: error.message
      });
    }
  }

  // Clean up inactive bikes
  async cleanupInactiveBikes(req, res) {
    try {
      const { maxAgeMinutes = 30 } = req.query;
      const removedCount = geoFencingService.cleanupInactiveBikes(parseInt(maxAgeMinutes));
      
      res.json({
        success: true,
        data: {
          removedCount,
          maxAgeMinutes: parseInt(maxAgeMinutes),
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`Cleaned up ${removedCount} inactive bikes`);
    } catch (error) {
      logger.error('Error cleaning up inactive bikes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup inactive bikes',
        message: error.message
      });
    }
  }

  // Health check for geo-fencing service
  async healthCheck(req, res) {
    try {
      const stats = geoFencingService.getStats();
      const activeSessions = geoFencingService.getAllSessions();
      
      const health = {
        status: 'healthy',
        service: 'geo-fencing',
        version: '1.0.0',
        stats,
        activeSessions: activeSessions.length,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: health
      });

      logger.debug('Geo-fencing health check completed');
    } catch (error) {
      logger.error('Error in geo-fencing health check:', error);
      res.status(500).json({
        success: false,
        error: 'Geo-fencing service health check failed',
        message: error.message
      });
    }
  }
}

module.exports = new GeofenceController();