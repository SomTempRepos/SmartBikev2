// routes/geofenceRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const geoController = require('../controllers/geofenceController');

router.post('/set', authenticateJWT, geoController.setGeofence);
router.get('/:bikeId', authenticateJWT, geoController.getGeofence);
router.get('/', authenticateJWT, geoController.getAllGeofences);
router.post('/:bikeId/disable', authenticateJWT, geoController.disableGeofence);
router.get('/:bikeId/status', authenticateJWT, geoController.checkGeofenceStatus);
router.get('/stats/:bikeId?', authenticateJWT, geoController.getGeofenceStats);

module.exports = router;
