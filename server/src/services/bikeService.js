// // src/services/bikeService.js
// const FileManager = require('../utils/fileManager');
// const Helpers = require('../utils/helper');
// const { BIKES_FILE } = require('../config/database');
// const { getIO } = require('../config/socket');
// const geoFencingService = require('./geofencingService');
// const { SOCKET_EVENTS, GEOFENCE_STATUS, ALERT_TYPES } = require('../utils/constants');
// const path = require('path');

// const processIncomingData = async (incoming) => {
//   try {
//     console.log('📥 Incoming data received:', JSON.stringify(incoming, null, 2));

//     if (!incoming?.bikeId || !incoming?.data) {
//       return { success: false, error: 'Invalid data format. Required: bikeId and data object' };
//     }

//     const { bikeId, data } = incoming;

//     if (!data.avgSpeed || !data.location || !data.battery) {
//       return {
//         success: false,
//         error: 'Missing required data fields: avgSpeed, location, battery'
//       };
//     }

//     const timestamp = Helpers.getCurrentTimestamp();
//     const enrichedData = {
//       ...incoming,
//       timestamp,
//       serverTimestamp: timestamp,
//       receivedAt: Date.now()
//     };

//     // Geofencing check
//     const geofenceResult = await geoFencingService.checkGeofence(
//       bikeId,
//       data.location.lat,
//       data.location.lng
//     );
//     enrichedData.geofenceStatus = geofenceResult;

//     // Read and update bikes.json
//     let bikes = await FileManager.readJson(BIKES_FILE);
//     if (!Array.isArray(bikes)) bikes = [];

//     const bikeIndex = bikes.findIndex(b => b.bikeId === bikeId);

//     const updatedBike = {
//       bikeId,
//       lastSeen: timestamp,
//       currentLocation: data.location,
//       avgSpeed: parseFloat(data.avgSpeed),
//       batteryLevel: parseFloat(data.battery),
//       geofenceStatus: geofenceResult.status || GEOFENCE_STATUS.NO_GEOFENCE,
//       isWithinGeofence: geofenceResult.isWithinBounds ?? true,
//       ...(bikes[bikeIndex] || {
//         createdAt: timestamp,
//         status: 'active'
//       })
//     };

//     if (bikeIndex !== -1) {
//       bikes[bikeIndex] = { ...bikes[bikeIndex], ...updatedBike };
//     } else {
//       bikes.push(updatedBike);
//     }

//     await FileManager.writeJson(BIKES_FILE, bikes);
//     await FileManager.appendToDailyLog(Helpers.getTodayString(), enrichedData);

//     // Emit over WebSocket
//     const io = getIO();
//     if (io) {
//       io.emit(SOCKET_EVENTS.BIKE_DATA, enrichedData);
//       io.emit(SOCKET_EVENTS.BIKE_UPDATE, {
//         bikeId,
//         data,
//         timestamp,
//         geofenceStatus: geofenceResult.status || GEOFENCE_STATUS.NO_GEOFENCE,
//         isWithinBounds: geofenceResult.isWithinBounds ?? true,
//         distanceFromBase: geofenceResult.distance || 0
//       });

//       // Emit alert if out of geofence
//       if (geofenceResult.hasGeofence && !geofenceResult.isWithinBounds) {
//         const alertData = {
//           id: Date.now(),
//           bikeId,
//           type: ALERT_TYPES.FENCE_BREACH,
//           message: `Bike ${bikeId} has left the geo-fence area`,
//           distance: geofenceResult.distance?.toString() || 'N/A',
//           timestamp,
//           violation: geofenceResult
//         };
//         io.emit(SOCKET_EVENTS.GEOFENCE_ALERT, alertData);
//       }
//     }

//     return { success: true, data: enrichedData };
//   } catch (error) {
//     console.error('❌ processIncomingData failed:', error);
//     return { success: false, error: error.message || 'Internal server error' };
//   }
// };


// const getAllBikes = async () => await FileManager.readJson(BIKES_FILE);

// const getBikeById = async (bikeId) => {
//   const bikes = await FileManager.readJson(BIKES_FILE);
//   return bikes.find(b => b.bikeId === bikeId);
// };

// const getLatestBikeData = async (bikeId) => {
//   const logs = await FileManager.getDailyLog(Helpers.getTodayString());
//   if (!logs) return null;
//   const data = logs.filter(entry => entry.bikeId === bikeId);
//   return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
// };

// module.exports = {
//   processIncomingData,
//   getAllBikes,
//   getBikeById,
//   getLatestBikeData
// };
const FileManager = require('../utils/fileManager');
const Helpers = require('../utils/helper');
const { BIKES_FILE } = require('../config/database');
const { getIO } = require('../config/socket');
const { SOCKET_EVENTS, GEOFENCE_STATUS } = require('../utils/constants');
const path = require('path');

const processIncomingData = async (incoming) => {
  try {
    console.log('📥 Incoming data received:', JSON.stringify(incoming, null, 2));

    if (!incoming?.bikeId || !incoming?.data) {
      return { success: false, error: 'Invalid data format. Required: bikeId and data object' };
    }

    const { bikeId, data } = incoming;

    if (!data.avgSpeed || !data.location || !data.battery) {
      return {
        success: false,
        error: 'Missing required data fields: avgSpeed, location, battery'
      };
    }

    const timestamp = Helpers.getCurrentTimestamp();
    const enrichedData = {
      ...incoming,
      timestamp,
      serverTimestamp: timestamp,
      receivedAt: Date.now(),
      geofenceStatus: {
        isWithinBounds: true,
        hasGeofence: false,
        status: GEOFENCE_STATUS.NO_GEOFENCE,
        distance: 0
      }
    };

    // Read and update bikes.json
    let bikes = await FileManager.readJson(BIKES_FILE);
    if (!Array.isArray(bikes)) bikes = [];

    const bikeIndex = bikes.findIndex(b => b.bikeId === bikeId);

    const updatedBike = {
      bikeId,
      lastSeen: timestamp,
      currentLocation: data.location,
      avgSpeed: parseFloat(data.avgSpeed),
      batteryLevel: parseFloat(data.battery),
      geofenceStatus: GEOFENCE_STATUS.NO_GEOFENCE,
      isWithinGeofence: true,
      ...(bikes[bikeIndex] || {
        createdAt: timestamp,
        status: 'active'
      })
    };

    if (bikeIndex !== -1) {
      bikes[bikeIndex] = { ...bikes[bikeIndex], ...updatedBike };
    } else {
      bikes.push(updatedBike);
    }

    await FileManager.writeJson(BIKES_FILE, bikes);
    await FileManager.appendToDailyLog(Helpers.getTodayString(), enrichedData);

    // Emit over WebSocket
    const io = getIO();
    if (io) {
      io.emit(SOCKET_EVENTS.BIKE_DATA, enrichedData);
      io.emit(SOCKET_EVENTS.BIKE_UPDATE, {
        bikeId,
        data,
        timestamp,
        geofenceStatus: GEOFENCE_STATUS.NO_GEOFENCE,
        isWithinBounds: true,
        distanceFromBase: 0
      });
    }

    return { success: true, data: enrichedData };
  } catch (error) {
    console.error('❌ processIncomingData failed:', error);
    return { success: false, error: error.message || 'Internal server error' };
  }
};

const getAllBikes = async () => await FileManager.readJson(BIKES_FILE);

const getBikeById = async (bikeId) => {
  const bikes = await FileManager.readJson(BIKES_FILE);
  return bikes.find(b => b.bikeId === bikeId);
};

const getLatestBikeData = async (bikeId) => {
  const logs = await FileManager.getDailyLog(Helpers.getTodayString());
  if (!logs) return null;
  const data = logs.filter(entry => entry.bikeId === bikeId);
  return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
};

module.exports = {
  processIncomingData,
  getAllBikes,
  getBikeById,
  getLatestBikeData
};
