// src/controllers/bikeController.js - Integrated Implementation
const moment = require('moment');
const BikeService = require('../services/bikeService');
const geoFencingService = require('../services/geofencingService');
const socketService = require('../services/socketService');
const logger = require('../utils/logger');
const Helpers = require('../utils/helper');
const { validateBikeData, validatePaginationParams } = require('../middleware/validation');

class BikeController {

  /**
   * Get all bikes with optional filtering and geo-fence status
   */
  async getAllBikes(req, res) {
    try {
      const { includeGeofence = false, status, guardianId } = req.query;
      
      // Get bikes from service layer
      const bikes = await BikeService.getAllBikes({ status, guardianId });
      
      // Enrich with geo-fence data if requested
      let enrichedBikes = bikes;
      if (includeGeofence === 'true') {
        enrichedBikes = bikes.map(bike => {
          const geoFenceStatus = geoFencingService.getBikeGeofenceStatus(bike.bikeId);
          return {
            ...bike,
            geofence: geoFenceStatus
          };
        });
      }

      const response = Helpers.createSuccessResponse({
        bikes: enrichedBikes,
        count: enrichedBikes.length,
        filters: { status, guardianId, includeGeofence },
        timestamp: moment().toISOString()
      }, 'Bikes retrieved successfully');

      res.json(response);
      logger.info(`Retrieved ${enrichedBikes.length} bikes via integrated controller`);

    } catch (error) {
      logger.error('Error fetching all bikes:', error);
      res.status(500).json(Helpers.createErrorResponse(error));
    }
  }

  /**
   * Get bike by ID with comprehensive data
   */
  async getBikeById(req, res) {
    try {
      const { bikeId } = req.params;
      const { includeHistory = false, includeGeofence = true } = req.query;

      if (!bikeId) {
        return res.status(400).json(
          Helpers.createErrorResponse(new Error('Bike ID is required'))
        );
      }

      // Get basic bike data from service
      const bike = await BikeService.getBikeById(bikeId);
      if (!bike) {
        return res.status(404).json(
          Helpers.createErrorResponse(new Error('Bike not found'))
        );
      }

      // Enrich with additional data
      let enrichedBike = { ...bike };

      // Add geo-fence status if requested
      if (includeGeofence === 'true') {
        const geoFenceStatus = geoFencingService.getBikeGeofenceStatus(bikeId);
        enrichedBike.geofence = geoFenceStatus;
      }

      // Add recent history if requested
      if (includeHistory === 'true') {
        const recentHistory = await BikeService.getBikeHistory(bikeId, { limit: 10 });
        enrichedBike.recentHistory = recentHistory;
      }

      const response = Helpers.createSuccessResponse({
        bike: enrichedBike,
        timestamp: moment().toISOString()
      }, 'Bike data retrieved successfully');

      res.json(response);
      logger.info(`Retrieved comprehensive data for bike ${bikeId}`);

    } catch (error) {
      logger.error(`Error fetching bike ${req.params.bikeId}:`, error);
      res.status(500).json(Helpers.createErrorResponse(error));
    }
  }

  /**
   * Get latest bike data with real-time status
   */
  async getLatestBikeData(req, res) {
    try {
      const { bikeId } = req.params;

      // Get latest data from service
      const latestData = await BikeService.getLatestBikeData(bikeId);
      if (!latestData) {
        return res.status(404).json(
          Helpers.createErrorResponse(new Error('No recent data found for this bike'))
        );
      }

      // Add real-time geo-fence check if location available
      let geoFenceCheck = null;
      if (latestData.location && latestData.location.lat && latestData.location.lng) {
        try {
          geoFenceCheck = await geoFencingService.checkGeofence(
            bikeId,
            latestData.location.lat,
            latestData.location.lng
          );
        } catch (geoError) {
          logger.warn(`Geo-fence check failed for bike ${bikeId}:`, geoError);
          geoFenceCheck = { error: 'Geo-fence check unavailable' };
        }
      }

      const response = Helpers.createSuccessResponse({
        bikeId,
        latestData,
        geoFenceStatus: geoFenceCheck,
        timestamp: moment().toISOString()
      }, 'Latest bike data retrieved');

      res.json(response);
      logger.info(`Retrieved latest data for bike ${bikeId}`);

    } catch (error) {
      logger.error(`Error fetching latest data for bike ${req.params.bikeId}:`, error);
      res.status(500).json(Helpers.createErrorResponse(error));
    }
  }

  /**
   * Receive and process bike data from ESP32/simulator
   * Integrated with geo-fencing and real-time features
   */
  async receiveBikeData(req, res) {
    try {
      const { bikeId, data } = req.body;

      // Pre-validation (before service processing)
      if (!bikeId || !data) {
        return res.status(400).json(
          Helpers.createErrorResponse(new Error('Missing required fields: bikeId and data'))
        );
      }

      // Validate location data if present
      if (data.location) {
        if (typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
          return res.status(400).json(
            Helpers.createErrorResponse(new Error('Invalid location data: lat and lng must be numbers'))
          );
        }
      }

      // Process through service layer first
      const serviceResult = await BikeService.processIncomingData(req.body);
      if (!serviceResult.success) {
        return res.status(400).json(Helpers.createErrorResponse(serviceResult.error));
      }

      // Process through geo-fencing service (parallel processing)
      let geoFenceResult = { success: false, sessionsChecked: 0 };
      if (data.location) {
        try {
          geoFenceResult = await geoFencingService.processBikeData({ bikeId, data });
          
          // Emit real-time updates via socket if geo-fence violated
          if (geoFenceResult.violation) {
            socketService.emitGeofenceViolation(bikeId, {
              location: data.location,
              violation: geoFenceResult.violation,
              timestamp: moment().toISOString()
            });
          }
        } catch (geoError) {
          logger.warn(`Geo-fence processing failed for bike ${bikeId}:`, geoError);
        }
      }

      // Emit general bike data update
      try {
        socketService.emitBikeDataUpdate(bikeId, {
          data: serviceResult.data,
          timestamp: moment().toISOString()
        });
      } catch (socketError) {
        logger.warn(`Socket emission failed for bike ${bikeId}:`, socketError);
      }

      const response = Helpers.createSuccessResponse({
        bikeId,
        processed: true,
        geoFencing: {
          processed: geoFenceResult.success,
          sessionsChecked: geoFenceResult.sessionsChecked,
          violation: geoFenceResult.violation || false
        },
        realTimeUpdate: true,
        timestamp: moment().toISOString()
      }, 'Bike data received and processed successfully');

      res.json(response);
      logger.info(`✅ Processed data from bike ${bikeId} at ${moment().format('HH:mm:ss')}`);

    } catch (error) {
      logger.error('Error processing bike data:', error);
      res.status(500).json(Helpers.createErrorResponse(error));
    }
  }

  /**
   * Get bike history with filtering options
   */
  async getBikeHistory(req, res) {
    try {
      const { bikeId } = req.params;
      const { 
        startDate, 
        endDate, 
        limit = 100, 
        offset = 0,
        includeGeofenceEvents = false 
      } = req.query;

      // Validate pagination parameters
      const pagination = validatePaginationParams({ limit, offset });
      if (!pagination.valid) {
        return res.status(400).json(
          Helpers.createErrorResponse(new Error(pagination.error))
        );
      }

      // Get history from service
      const history = await BikeService.getBikeHistory(bikeId, {
        startDate,
        endDate,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Add geo-fence events if requested
      let geoFenceEvents = [];
      if (includeGeofenceEvents === 'true') {
        try {
          geoFenceEvents = geoFencingService.getBikeGeofenceHistory(bikeId, {
            startDate,
            endDate
          });
        } catch (geoError) {
          logger.warn(`Failed to fetch geo-fence events for bike ${bikeId}:`, geoError);
        }
      }

      const response = Helpers.createSuccessResponse({
        bikeId,
        history,
        geoFenceEvents,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: history.length
        },
        filters: { startDate, endDate },
        timestamp: moment().toISOString()
      }, 'Bike history retrieved successfully');

      res.json(response);
      logger.info(`Retrieved history for bike ${bikeId} (${history.length} records)`);

    } catch (error) {
      logger.error(`Error fetching bike history for ${req.params.bikeId}:`, error);
      res.status(500).json(Helpers.createErrorResponse(error));
    }
  }

  /**
   * Test ESP32 connectivity through integrated approach
   */
  async testESP32Connection(req, res) {
    try {
      const { endpoint, bikeId = 'TEST_BIKE' } = req.body;

      if (!endpoint) {
        return res.status(400).json(
          Helpers.createErrorResponse(new Error('ESP32 endpoint is required'))
        );
      }

      // Test through geo-fencing service (which handles ESP32 communication)
      const testResult = await geoFencingService.sendAlertToESP32(bikeId, {
        status: 'ok',
        message: 'test connection from integrated controller',
        distance: '0.00',
        timestamp: moment().toLocaleTimeString()
      }, endpoint);

      const response = Helpers.createSuccessResponse({
        endpoint,
        bikeId,
        connectionTest: testResult,
        timestamp: moment().toISOString()
      }, testResult.success ? 'ESP32 connection test successful' : 'ESP32 connection test failed');

      res.json(response);
      logger.info(`ESP32 connection test completed for ${endpoint}:`, testResult.success);

    } catch (error) {
      logger.error('Error testing ESP32 connection:', error);
      res.status(500).json(Helpers.createErrorResponse(error));
    }
  }

  /**
   * Comprehensive health check combining all services
   */
  async healthCheck(req, res) {
    try {
      // Get basic bike service health
      const bikeServiceHealth = await BikeService.getHealthStatus();
      
      // Get geo-fencing service health
      const geoFencingHealth = geoFencingService.getStats();
      const activeSessions = geoFencingService.getAllSessions();
      
      // Get socket service status
      let socketHealth = { connected: false, clients: 0 };
      try {
        socketHealth = socketService.getConnectionStatus();
      } catch (socketError) {
        logger.warn('Socket service health check failed:', socketError);
      }

      const overallHealth = {
        status: 'healthy',
        service: 'integrated-bike-controller',
        version: '2.0.0',
        components: {
          bikeService: bikeServiceHealth,
          geoFencing: {
            ...geoFencingHealth,
            activeSessions: activeSessions.length
          },
          socketService: socketHealth
        },
        timestamp: moment().toISOString()
      };

      const response = Helpers.createSuccessResponse(overallHealth, 'Health check completed');
      res.json(response);
      logger.debug('Integrated bike controller health check completed');

    } catch (error) {
      logger.error('Error in integrated bike controller health check:', error);
      
      const unhealthyResponse = {
        success: false,
        data: {
          status: 'unhealthy',
          service: 'integrated-bike-controller',
          error: error.message,
          timestamp: moment().toISOString()
        }
      };
      
      res.status(500).json(unhealthyResponse);
    }
  }

  /**
   * Get comprehensive bike statistics
   */
  async getBikeStats(req, res) {
    try {
      const { bikeId } = req.params;
      const { period = '24h' } = req.query;

      // Get basic bike stats from service
      const bikeStats = await BikeService.getBikeStatistics(bikeId, period);
      
      // Get geo-fence specific stats
      const geoFenceStats = geoFencingService.getStatistics(bikeId);
      
      const response = Helpers.createSuccessResponse({
        bikeId,
        period,
        statistics: {
          ...bikeStats,
          geofencing: geoFenceStats
        },
        timestamp: moment().toISOString()
      }, 'Bike statistics retrieved successfully');

      res.json(response);
      logger.info(`Retrieved comprehensive statistics for bike ${bikeId}`);

    } catch (error) {
      logger.error(`Error fetching bike statistics for ${req.params.bikeId}:`, error);
      res.status(500).json(Helpers.createErrorResponse(error));
    }
  }

  /**
   * Bulk operations for multiple bikes
   */
  async bulkOperation(req, res) {
    try {
      const { operation, bikeIds, params = {} } = req.body;
      
      if (!operation || !Array.isArray(bikeIds) || bikeIds.length === 0) {
        return res.status(400).json(
          Helpers.createErrorResponse(new Error('Operation and bikeIds array are required'))
        );
      }

      const results = [];
      
      for (const bikeId of bikeIds) {
        try {
          let result;
          switch (operation) {
            case 'getStatus':
              result = await BikeService.getBikeById(bikeId);
              break;
            case 'getGeofenceStatus':
              result = geoFencingService.getBikeGeofenceStatus(bikeId);
              break;
            case 'cleanup':
              result = await BikeService.cleanupBikeData(bikeId, params);
              break;
            default:
              throw new Error(`Unsupported operation: ${operation}`);
          }
          
          results.push({ bikeId, success: true, data: result });
        } catch (opError) {
          results.push({ bikeId, success: false, error: opError.message });
          logger.warn(`Bulk operation ${operation} failed for bike ${bikeId}:`, opError);
        }
      }

      const successCount = results.filter(r => r.success).length;
      const response = Helpers.createSuccessResponse({
        operation,
        processed: bikeIds.length,
        successful: successCount,
        failed: bikeIds.length - successCount,
        results,
        timestamp: moment().toISOString()
      }, `Bulk operation ${operation} completed`);

      res.json(response);
      logger.info(`Bulk operation ${operation} completed: ${successCount}/${bikeIds.length} successful`);

    } catch (error) {
      logger.error('Error in bulk operation:', error);
      res.status(500).json(Helpers.createErrorResponse(error));
    }
  }
}

module.exports = new BikeController();