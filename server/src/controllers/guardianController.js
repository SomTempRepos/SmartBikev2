// controllers/guardianController.js
const guardianService = require('../services/guardianService');
const Helpers = require('../utils/helper');

const getGuardianProfile = async (req, res) => {
  try {
    const guardian = await guardianService.getOrCreateGuardian(req.user);
    res.json({ guardian });
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

const getGuardianBikes = async (req, res) => {
  try {
    const bikes = await guardianService.getBikesForGuardian(req.user.id);
    res.json({ bikes });
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

module.exports = {
  getGuardianProfile,
  getGuardianBikes
};
