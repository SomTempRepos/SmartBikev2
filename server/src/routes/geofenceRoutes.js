// src/routes/geofenceRoutes.js
const express = require('express');
const geofenceController = require('../controllers/geofenceController');
const { authenticateJWT } = require('../middleware/auth'); // Optional: if you want authentication

const router = express.Router();

/**
 * @route GET /api/geofence/bikes
 * @desc Get all bikes with geo-fence status
 * @access Public (or add authenticateJWT middleware)
 */
router.get('/bikes', geofenceController.getBikes);

/**
 * @route GET /api/geofence/stats
 * @desc Get geo-fence statistics
 * @access Public
 */
router.get('/stats', geofenceController.getStats);

/**
 * @route GET /api/geofence/sessions
 * @desc Get all active geo-fence sessions
 * @access Public
 */
router.get('/sessions', geofenceController.getSessions);

/**
 * @route GET /api/geofence/sessions/:sessionId
 * @desc Get configuration for a specific session
 * @access Public
 */
router.get('/sessions/:sessionId', geofenceController.getSessionConfig);

/**
 * @route GET /api/geofence/sessions/:sessionId/bikes
 * @desc Get bikes for a specific session
 * @access Public
 */
router.get('/sessions/:sessionId/bikes', geofenceController.getBikesForSession);

/**
 * @route POST /api/geofence/test-esp32
 * @desc Test ESP32 connectivity
 * @access Public
 */
router.post('/test-esp32', geofenceController.testESP32Connection);

/**
 * @route DELETE /api/geofence/cleanup
 * @desc Clean up inactive bikes
 * @access Public
 */
router.delete('/cleanup', geofenceController.cleanupInactiveBikes);

/**
 * @route GET /api/geofence/health
 * @desc Health check for geo-fencing service
 * @access Public
 */
router.get('/health', geofenceController.healthCheck);

module.exports = router;