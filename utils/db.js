const User = require('../models/User');

const checkIfUsernameExists = async (username) => {
  return await User.exists({
    username,
  });
};

const checkIfEmailExists = async (email) => {
  return await User.exists({
    email,
  });
};

module.exports = {
  checkIfEmailExists,
  checkIfUsernameExists,
};
