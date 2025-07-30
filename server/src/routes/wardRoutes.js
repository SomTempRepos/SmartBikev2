// routes/wardRoutes.js
const express = require('express');
const router = express.Router();
const wardController = require('../controllers/wardController');
const { authenticateJWT } = require('../middleware/auth');

router.post('/', authenticateJWT, wardController.addWard);
router.get('/', authenticateJWT, wardController.getWards);

module.exports = router;
