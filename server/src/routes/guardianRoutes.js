// routes/guardianRoutes.js
const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardianController');
const { authenticateJWT } = require('../middleware/auth');

router.get('/me', authenticateJWT, guardianController.getGuardianProfile);
router.get('/bikes', authenticateJWT, guardianController.getGuardianBikes);

module.exports = router;
