// src/services/geofencingService.js
const axios = require('axios');
const logger = require('../utils/logger');

class GeoFencingService {
  constructor() {
    this.bikes = new Map(); // Store bike data: bikeId -> bikeData
    this.sessions = new Map(); // Store session configs: socketId -> {baseLocation, radius, esp32Endpoint}
    this.io = null; // Will be injected by socketService
  }

  // Initialize with Socket.IO instance
  initialize(io) {
    this.io = io;
    logger.info('GeoFencing service initialized');
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  // Update geo-fence configuration for a session
  updateGeoFenceConfig(socketId, config) {
    const { baseLocation, radius, esp32Endpoint } = config;
    
    if (!baseLocation || !baseLocation.lat || !baseLocation.lng || !radius) {
      throw new Error('Invalid geo-fence configuration: baseLocation and radius are required');
    }

    if (radius <= 0) {
      throw new Error('Invalid radius: must be greater than 0');
    }

    this.sessions.set(socketId, {
      baseLocation,
      radius: parseFloat(radius),
      esp32Endpoint: esp32Endpoint || null,
      createdAt: new Date().toISOString()
    });

    logger.info(`Geo-fence updated for session ${socketId}`, {
      baseLocation,
      radius,
      esp32Endpoint
    });

    // Recheck all bikes with new configuration
    this.recheckAllBikes(socketId);

    return {
      success: true,
      message: 'Geo-fence configuration updated',
      config: this.sessions.get(socketId)
    };
  }

  // Remove session configuration
  removeSession(socketId) {
    const removed = this.sessions.delete(socketId);
    if (removed) {
      logger.info(`Session ${socketId} removed from geo-fencing`);
    }
    return removed;
  }

  // Process incoming bike data
  async processBikeData(bikeData) {
    try {
      const { bikeId, data } = bikeData;
      const timestamp = new Date().toISOString();

      // Validate bike data
      if (!data.location || !data.location.lat || !data.location.lng) {
        throw new Error('Invalid bike data: location is required');
      }

      // Store/update bike data
      const bikeInfo = {
        bikeId,
        currentLocation: data.location,
        avgSpeed: parseFloat(data.avgSpeed) || 0,
        batteryLevel: parseFloat(data.battery) || 0,
        lastSeen: timestamp,
        status: 'active',
        isOutsideFence: false,
        distanceFromBase: 0
      };

      this.bikes.set(bikeId, bikeInfo);

      // Check geo-fence for all active sessions
      for (const [socketId, sessionConfig] of this.sessions.entries()) {
        await this.checkGeoFence(bikeInfo, sessionConfig, socketId);
      }

      // Broadcast updated bike data to all connected clients
      if (this.io) {
        this.io.emit('bikeUpdate', {
          bikeId,
          data,
          timestamp
        });
      }

      logger.info(`Processed geo-fence data for bike ${bikeId}`);
      
      return {
        success: true,
        bikeId,
        timestamp,
        sessionsChecked: this.sessions.size
      };

    } catch (error) {
      logger.error('Error processing bike data for geo-fencing:', error);
      throw error;
    }
  }

  // Check if bike is within geo-fence and handle alerts
  async checkGeoFence(bikeInfo, sessionConfig, socketId) {
    try {
      const { baseLocation, radius, esp32Endpoint } = sessionConfig;
      
      if (!baseLocation || !bikeInfo.currentLocation) {
        return;
      }

      const distance = this.calculateDistance(
        baseLocation.lat,
        baseLocation.lng,
        bikeInfo.currentLocation.lat,
        bikeInfo.currentLocation.lng
      );

      const isOutsideFence = distance > radius;
      const previousState = bikeInfo.isOutsideFence;
      
      // Update bike fence status
      bikeInfo.isOutsideFence = isOutsideFence;
      bikeInfo.distanceFromBase = distance;

      // Generate alert if bike status changed (entered or left fence)
      if (previousState !== isOutsideFence) {
        const alert = {
          id: Date.now(),
          bikeId: bikeInfo.bikeId,
          type: 'fence_breach',
          message: isOutsideFence 
            ? `Bike ${bikeInfo.bikeId} has left the geo-fence area`
            : `Bike ${bikeInfo.bikeId} has entered the geo-fence area`,
          distance: distance.toFixed(2),
          timestamp: new Date().toLocaleTimeString(),
          status: isOutsideFence ? 'outside' : 'inside',
          sessionId: socketId
        };

        // Send alert to frontend (specific session)
        if (this.io) {
          this.io.to(socketId).emit('geoFenceAlert', alert);
        }

        // Send alert to ESP32
        await this.sendAlertToESP32(bikeInfo.bikeId, {
          status: isOutsideFence ? 'nok' : 'ok',
          message: isOutsideFence ? 'outside geofence' : 'inside geofence',
          distance: distance.toFixed(2),
          timestamp: alert.timestamp
        }, esp32Endpoint);

        logger.info(`Geo-fence alert generated for bike ${bikeInfo.bikeId}`, {
          status: alert.status,
          distance: alert.distance,
          sessionId: socketId
        });
      }

    } catch (error) {
      logger.error(`Error checking geo-fence for bike ${bikeInfo.bikeId}:`, error);
    }
  }

  // Recheck all bikes when geo-fence configuration changes
  async recheckAllBikes(socketId) {
    try {
      const sessionConfig = this.sessions.get(socketId);
      if (!sessionConfig) {
        logger.warn(`No session config found for ${socketId}`);
        return;
      }

      logger.info(`Rechecking ${this.bikes.size} bikes for session ${socketId}`);

      for (const bikeInfo of this.bikes.values()) {
        await this.checkGeoFence(bikeInfo, sessionConfig, socketId);
      }

    } catch (error) {
      logger.error(`Error rechecking bikes for session ${socketId}:`, error);
    }
  }

  // Send alert to ESP32 via HTTP POST
  async sendAlertToESP32(bikeId, alertData, esp32Endpoint) {
    try {
      // If no specific endpoint provided, use default
      const endpoint = esp32Endpoint || process.env.ESP32_DEFAULT_ENDPOINT || 'http://192.168.1.100:8080/alert';
      
      const payload = {
        bikeId,
        alert: alertData,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(endpoint, payload, {
        timeout: parseInt(process.env.ESP32_TIMEOUT || '5000'), // Default 5 seconds
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SmartCycle-GeoFence/1.0'
        }
      });

      logger.info(`Alert sent to ESP32 for bike ${bikeId}`, {
        endpoint,
        status: response.status,
        alertStatus: alertData.status
      });

      return {
        success: true,
        endpoint,
        status: response.status
      };

    } catch (error) {
      logger.error(`Failed to send alert to ESP32 for bike ${bikeId}`, {
        endpoint: esp32Endpoint,
        error: error.message,
        code: error.code
      });
      
      // Return error info but don't throw - we want geo-fencing to continue
      return {
        success: false,
        error: error.message,
        endpoint: esp32Endpoint
      };
    }
  }

  // Get current bike data (for API endpoints)
  getBikes() {
    return Array.from(this.bikes.values());
  }

  // Get bikes with geo-fence status for a specific session
  getBikesForSession(socketId) {
    const bikes = this.getBikes();
    const sessionConfig = this.sessions.get(socketId);
    
    if (!sessionConfig) {
      return bikes;
    }

    // Add session-specific geo-fence data
    return bikes.map(bike => ({
      ...bike,
      sessionId: socketId,
      geoFenceConfig: sessionConfig
    }));
  }

  // Get session configuration
  getSessionConfig(socketId) {
    return this.sessions.get(socketId);
  }

  // Get all active sessions
  getAllSessions() {
    const sessions = [];
    for (const [socketId, config] of this.sessions.entries()) {
      sessions.push({
        socketId,
        ...config
      });
    }
    return sessions;
  }

  // Get geo-fencing statistics
  getStats() {
    const bikes = this.getBikes();
    const totalBikes = bikes.length;
    const activeBikes = bikes.filter(bike => bike.status === 'active').length;
    const bikesOutsideFence = bikes.filter(bike => bike.isOutsideFence).length;
    const bikesInsideFence = totalBikes - bikesOutsideFence;

    return {
      totalBikes,
      activeBikes,
      bikesInsideFence,
      bikesOutsideFence,
      activeSessions: this.sessions.size,
      lastUpdate: new Date().toISOString()
    };
  }

  // Clean up inactive bikes (optional - call periodically)
  cleanupInactiveBikes(maxAgeMinutes = 30) {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let removedCount = 0;

    for (const [bikeId, bikeInfo] of this.bikes.entries()) {
      const lastSeen = new Date(bikeInfo.lastSeen);
      if (lastSeen < cutoffTime) {
        this.bikes.delete(bikeId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info(`Cleaned up ${removedCount} inactive bikes`);
    }

    return removedCount;
  }
}

// Export singleton instance
const geoFencingService = new GeoFencingService();
module.exports = geoFencingService;