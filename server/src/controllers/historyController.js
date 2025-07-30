// controllers/historyController.js
const FileManager = require('../utils/fileManager');
const Helpers = require('../utils/helper');

const getLogsByDate = async (req, res) => {
  const { date } = req.params;
  if (!Helpers.isValidDate(date)) {
    return res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD)' });
  }

  try {
    const data = await FileManager.getDailyLog(date);
    if (!data) {
      return res.status(404).json({ error: 'No data found for this date' });
    }

    res.json({ date, data });
  } catch (error) {
    res.status(500).json(Helpers.createErrorResponse(error));
  }
};

const listAvailableDates = async (req, res) => {
  try {
    const dates = await FileManager.getAvailableDates();
    res.json({ availableDates: dates });
  } catch (error) {
    res.status(500).json(Helpers.createErrorResponse(error));
  }
};

module.exports = {
  getLogsByDate,
  listAvailableDates
};
