// controllers/wardController.js
const guardianService = require('../services/guardianService');
const Helpers = require('../utils/helper');

const addWard = async (req, res) => {
  try {
    const { name, age, grade, bikeName } = req.body;

    if (!name || !age || !grade || !bikeName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const { ward, bike } = await guardianService.addWardToGuardian(req.user, {
      name,
      age,
      grade,
      bikeName
    });

    res.status(201).json({ message: 'Ward added successfully', ward, bike });
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

const getWards = async (req, res) => {
  try {
    const wards = await guardianService.getWardsForGuardian(req.user.id);
    res.json({ wards });
  } catch (err) {
    res.status(500).json(Helpers.createErrorResponse(err));
  }
};

module.exports = {
  addWard,
  getWards
};
