// src/routes/bikeRoutes.js - Integrated Routes
const express = require('express');
const router = express.Router();
const bikeController = require('../controllers/bikeController');

// Import middleware from separate files to avoid conflicts
const { validateBikeData, validateESP32Connection } = require('../middleware/validation');
const { rateLimitMiddleware } = require('../middleware/rateLimiting');
const authMiddleware = require('../middleware/auth');

// GET Routes - Bike Data Retrieval
router.get('/bikes', 
  authMiddleware.optional, 
  bikeController.getAllBikes
);

router.get('/bikes/:bikeId', 
  authMiddleware.optional, 
  bikeController.getBikeById
);

router.get('/bikes/:bikeId/latest', 
  authMiddleware.optional, 
  bikeController.getLatestBikeData
);

router.get('/bikes/:bikeId/history', 
  authMiddleware.optional, 
  bikeController.getBikeHistory
);

router.get('/bikes/:bikeId/stats', 
  authMiddleware.optional, 
  bikeController.getBikeStats
);

// POST Routes - Data Processing
router.post('/bikes/data', 
  rateLimitMiddleware(100, 60), // 100 requests per minute for data ingestion
  validateBikeData, 
  bikeController.receiveBikeData
);

router.post('/bikes/bulk', 
  authMiddleware.required, 
  rateLimitMiddleware(10, 60), // Limited bulk operations
  bikeController.bulkOperation
);

// ESP32 Integration Routes
router.post('/bikes/esp32/test', 
  authMiddleware.admin, 
  validateESP32Connection, 
  bikeController.testESP32Connection
);

// System Routes
router.get('/bikes/system/health', 
  bikeController.healthCheck
);

module.exports = router;
