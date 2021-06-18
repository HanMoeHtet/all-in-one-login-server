const jwt = require('jsonwebtoken');

const User = require('../models/User');

const secret = process.env.APP_SECRET;

const authMiddleware = async (req, res, next) => {
  const { token } = req.headers?.authorization?.split(' ')[1];
  if (!token) {
    return res.status(403).json({
      errors: {
        token: ['Token is required.'],
      },
    });
  }

  let userId;
  try {
    ({ userId } = jwt.verify(token, secret));
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        token: ['Invalid token.'],
      },
    });
  }

  let user;
  try {
    user = await User.findOne({
      _id: userId,
    });
    if (!user) throw Error();
  } catch (err) {
    return res.status(400).json({
      errors: {
        token: ['Invalid token.'],
      },
    });
  }

  req.user = user;

  return next();
};

module.exports = {
  authMiddleware,
};
