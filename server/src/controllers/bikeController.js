// src/controllers/bikeController.js
const BikeService = require('../services/bikeService');
const Helpers = require('../utils/helper');

const getAllBikes = async (req, res) => {
  try {
    const bikes = await BikeService.getAllBikes();
    res.json({ bikes });
  } catch (error) {
    res.status(500).json(Helpers.createErrorResponse(error));
  }
};

const getBikeById = async (req, res) => {
  try {
    const bike = await BikeService.getBikeById(req.params.bikeId);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });
    res.json({ bike });
  } catch (error) {
    res.status(500).json(Helpers.createErrorResponse(error));
  }
};

const getLatestBikeData = async (req, res) => {
  try {
    const latest = await BikeService.getLatestBikeData(req.params.bikeId);
    if (!latest) return res.status(404).json({ error: 'No data found' });
    res.json({ latestData: latest });
  } catch (error) {
    res.status(500).json(Helpers.createErrorResponse(error));
  }
};

const receiveBikeData = async (req, res) => {
  try {
    const { success, data, error } = await BikeService.processIncomingData(req.body);
    if (!success) return res.status(400).json(Helpers.createErrorResponse(error));
    res.json(Helpers.createSuccessResponse(data, 'Bike data received'));
  } catch (error) {
    res.status(500).json(Helpers.createErrorResponse(error));
  }
};

module.exports = {
  getAllBikes,
  getBikeById,
  getLatestBikeData,
  receiveBikeData
};
