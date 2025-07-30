// services/guardianService.js
const FileManager = require('../utils/fileManager');
const Helpers = require('../utils/helper');
const {
  GUARDIANS_FILE,
  BIKES_FILE
} = require('../config/database');

const getOrCreateGuardian = async (user) => {
  const guardians = await FileManager.readJson(GUARDIANS_FILE);

  let guardian = guardians.find(g => g.userId === user.id);
  if (!guardian) {
    guardian = {
      guardianId: Helpers.generateGuardianId(guardians.length + 1),
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.mobile,
      createdAt: Helpers.getCurrentTimestamp(),
      status: 'active',
      wards: []
    };
    guardians.push(guardian);
    await FileManager.writeJson(GUARDIANS_FILE, guardians);
  }

  return guardian;
};

const getWardsForGuardian = async (userId) => {
  const guardians = await FileManager.readJson(GUARDIANS_FILE);
  const guardian = guardians.find(g => g.userId === userId);
  return guardian ? guardian.wards : [];
};

const addWardToGuardian = async (user, wardData) => {
  const guardians = await FileManager.readJson(GUARDIANS_FILE);
  const guardianIndex = guardians.findIndex(g => g.userId === user.id);

  if (guardianIndex === -1) {
    throw new Error('Guardian not found');
  }

  const wardId = Helpers.generateWardId(guardians[guardianIndex].wards.length + 1);
  const bikeId = Helpers.generateBikeId(guardians[guardianIndex].wards.length + 1);

  const newWard = {
    wardId,
    name: wardData.name,
    age: parseInt(wardData.age),
    grade: wardData.grade,
    bikeId,
    bikeName: wardData.bikeName,
    createdAt: Helpers.getCurrentTimestamp(),
    status: 'active'
  };

  guardians[guardianIndex].wards.push(newWard);
  await FileManager.writeJson(GUARDIANS_FILE, guardians);

  const bikes = await FileManager.readJson(BIKES_FILE);
  const newBike = {
    bikeId,
    wardId,
    guardianId: guardians[guardianIndex].guardianId,
    bikeName: wardData.bikeName,
    wardName: wardData.name,
    guardianName: user.name,
    status: 'active',
    lastSeen: Helpers.getCurrentTimestamp(),
    totalDistance: 0,
    totalRides: 0,
    avgSpeed: 0,
    currentLocation: {
      lat: 19.0760,
      lng: 72.8777
    }
  };

  bikes.push(newBike);
  await FileManager.writeJson(BIKES_FILE, bikes);

  return { ward: newWard, bike: newBike };
};

const getBikesForGuardian = async (userId) => {
  const guardians = await FileManager.readJson(GUARDIANS_FILE);
  const guardian = guardians.find(g => g.userId === userId);
  if (!guardian) return [];

  const bikes = await FileManager.readJson(BIKES_FILE);
  return bikes.filter(b => b.guardianId === guardian.guardianId);
};

module.exports = {
  getOrCreateGuardian,
  getWardsForGuardian,
  addWardToGuardian,
  getBikesForGuardian
};
