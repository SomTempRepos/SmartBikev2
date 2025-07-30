// routes/historyRoutes.js
const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

router.get('/', historyController.listAvailableDates);
router.get('/:date', historyController.getLogsByDate);

module.exports = router;
