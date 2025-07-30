
// services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FileManager = require('../utils/fileManager');
const { USERS_FILE } = require('../config/database');
const { JWT_SECRET } = require('../config/environment');
const { DEFAULTS } = require('../utils/constants');

const login = async ({ email, mobile, password }) => {
  const users = await FileManager.readJson(USERS_FILE);
  const user = users.find(u => u.email === email || u.mobile === mobile);
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: DEFAULTS.JWT_EXPIRY }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile
    }
  };
};

const signup = async ({ name, email, password, mobile }) => {
  const users = await FileManager.readJson(USERS_FILE);
  if (users.find(u => u.email === email)) {
    return { success: false, error: 'Email already registered' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
    name,
    email,
    password: hashedPassword,
    mobile
  };

  users.push(newUser);
  await FileManager.writeJson(USERS_FILE, users);

  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email },
    JWT_SECRET,
    { expiresIn: DEFAULTS.JWT_EXPIRY }
  );

  return {
    success: true,
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      mobile: newUser.mobile
    }
  };
};

const getProfile = async (userId) => {
  const users = await FileManager.readJson(USERS_FILE);
  return users.find(u => u.id === userId);
};

module.exports = { login, signup, getProfile };

