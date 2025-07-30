
// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.get('/me', authenticateJWT, authController.getProfile);

module.exports = router;