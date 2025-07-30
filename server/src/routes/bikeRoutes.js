// src/routes/bikeRoutes.js
const express = require('express');
const router = express.Router();
const bikeController = require('../controllers/bikeController');

// POST: Bike telemetry
router.post('/data', bikeController.receiveBikeData);

// GET: All bikes
router.get('/', bikeController.getAllBikes);

// GET: Specific bike
router.get('/:bikeId', bikeController.getBikeById);

// GET: Latest data for a specific bike
router.get('/:bikeId/latest', bikeController.getLatestBikeData);

module.exports = router;
