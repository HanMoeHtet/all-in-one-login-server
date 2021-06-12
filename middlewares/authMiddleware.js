const { UNAUTHORIZED, INVALID_USER_ID } = require('../constants/errorTypes');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  /**
   * TODO: use jwt instead
   */
  const { userId } = req.query;
  let user;
  try {
    user = await User.findOne({
      _id: userId,
    });
  } catch (err) {
    return res.status(404).json({
      error: INVALID_USER_ID,
      message: 'User id is invalid',
    });
  }

  if (!user) {
    return res.status(401).json({
      error: UNAUTHORIZED,
      message: 'Access denied. Please log in.',
    });
  }

  req.user = user;

  return next();
};

module.exports = {
  authMiddleware,
};
