// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const bikeRoutes = require('./bikeRoutes');
const guardianRoutes = require('./guardianRoutes');
const wardRoutes = require('./wardRoutes');
const geofenceRoutes = require('./geofenceRoutes');
const historyRoutes = require('./historyRoutes');
const rankRoutes = require('./rankRoutes');

router.use('/', authRoutes);
router.use('/bike', bikeRoutes);
router.use('/bikes', bikeRoutes);
router.use('/guardian', guardianRoutes);
router.use('/guardian/wards', wardRoutes);
router.use('/geofence', geofenceRoutes);
router.use('/geofences', geofenceRoutes); // for /api/geofences
router.use('/history', historyRoutes);
router.use('/ranks', rankRoutes);

module.exports = router;
