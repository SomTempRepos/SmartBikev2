// controllers/geofenceController.js
const geoService = require('../services/geofencingService');
const FileManager = require('../utils/fileManager');
const { BIKES_FILE, GUARDIANS_FILE } = require('../config/database');
const Helpers = require('../utils/helper');

const setGeofence = async (req, res) => {
  try {
    const { bikeId, baseLat, baseLng, radius } = req.body;
    if (!bikeId || !baseLat || !baseLng || !radius) {
      return res.status(400).json({ error: 'All fields required: bikeId, baseLat, baseLng, radius' });
    }

    const guardian = await getGuardianFromUserId(req.user.id);
    const bike = await getBikeForGuardian(bikeId, guardian.guardianId);
    if (!bike) {
      return res.status(403).json({ error: 'Bike not found or unauthorized' });
    }

    const result = await geoService.setGeofence(bikeId, baseLat, baseLng, radius, guardian.guardianId);
    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }

    res.json({ message: 'Geofence set successfully', geofence: result.geofence });
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

const getGeofence = async (req, res) => {
  try {
    const { bikeId } = req.params;
    const guardian = await getGuardianFromUserId(req.user.id);
    const bike = await getBikeForGuardian(bikeId, guardian.guardianId);
    if (!bike) {
      return res.status(403).json({ error: 'Bike not found or unauthorized' });
    }

    const geofence = geoService.getGeofence(bikeId);
    if (!geofence) {
      return res.status(404).json({ error: 'No geofence found for this bike' });
    }

    res.json({ geofence });
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

const getAllGeofences = async (req, res) => {
  try {
    const guardian = await getGuardianFromUserId(req.user.id);
    const bikes = await FileManager.readJson(BIKES_FILE);
    const guardianBikes = bikes.filter(b => b.guardianId === guardian.guardianId);

    const geofences = guardianBikes
      .map(bike => {
        const geo = geoService.getGeofence(bike.bikeId);
        return geo ? { ...geo, bikeName: bike.bikeName, wardName: bike.wardName } : null;
      })
      .filter(Boolean);

    res.json({ geofences });
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

const disableGeofence = async (req, res) => {
  try {
    const { bikeId } = req.params;
    const guardian = await getGuardianFromUserId(req.user.id);
    const bike = await getBikeForGuardian(bikeId, guardian.guardianId);
    if (!bike) {
      return res.status(403).json({ error: 'Bike not found or unauthorized' });
    }

    const success = await geoService.disableGeofence(bikeId);
    if (!success) {
      return res.status(404).json({ error: 'Geofence not found' });
    }

    res.json({ message: 'Geofence disabled successfully' });
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

const checkGeofenceStatus = async (req, res) => {
  try {
    const { bikeId } = req.params;
    const bikes = await FileManager.readJson(BIKES_FILE);
    const bike = bikes.find(b => b.bikeId === bikeId);

    if (!bike || !bike.currentLocation) {
      return res.status(404).json({ error: 'Bike not found or no location data available' });
    }

    const result = await geoService.checkGeofence(
      bikeId,
      bike.currentLocation.lat,
      bike.currentLocation.lng
    );

    res.json(result);
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

const getGeofenceStats = async (req, res) => {
  try {
    const { bikeId } = req.params;
    const stats = geoService.getStatistics(bikeId);
    if (bikeId && !stats) {
      return res.status(404).json({ error: 'No geofence statistics found for this bike' });
    }

    res.json({ statistics: stats });
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

// Helper: verify guardian and access
async function getGuardianFromUserId(userId) {
  const guardians = await FileManager.readJson(GUARDIANS_FILE);
  const guardian = guardians.find(g => g.userId === userId);
  if (!guardian) throw new Error('Guardian not found');
  return guardian;
}

async function getBikeForGuardian(bikeId, guardianId) {
  const bikes = await FileManager.readJson(BIKES_FILE);
  return bikes.find(b => b.bikeId === bikeId && b.guardianId === guardianId);
}

module.exports = {
  setGeofence,
  getGeofence,
  getAllGeofences,
  disableGeofence,
  checkGeofenceStatus,
  getGeofenceStats
};
