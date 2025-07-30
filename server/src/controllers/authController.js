// controllers/authController.js
const authService = require('../services/authService');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

const login = async (req, res) => {
  const { email, mobile, password } = req.body;
  if (!password || (!email && !mobile)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.REQUIRED_FIELDS });
  }
  try {
    const result = await authService.login({ email, mobile, password });
    if (!result) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

const signup = async (req, res) => {
  const { name, email, password, mobile } = req.body;
  if (!name || !email || !password || !mobile) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.REQUIRED_FIELDS });
  }
  try {
    const result = await authService.signup({ name, email, password, mobile });
    if (!result.success) {
      return res.status(HTTP_STATUS.CONFLICT).json({ error: result.error });
    }
    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
    }
    res.status(HTTP_STATUS.OK).json(user);
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

module.exports = { login, signup, getProfile };
