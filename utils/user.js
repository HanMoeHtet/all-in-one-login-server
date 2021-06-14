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

const checkIfPhoneNumberExists = async (phoneNumber) => {
  return await User.exists({
    phoneNumber,
  });
};

const getRandomString = (length = 3) => {
  return Array(length)
    .fill(0)
    .map((_) => Math.floor(Math.random() * 10))
    .join('');
};

const prepareUserResponseData = (user) => {
  return {
    userId: user._id,
    username: user.username,
    avatar: user.avatar,
  };
};

module.exports = {
  checkIfEmailExists,
  checkIfUsernameExists,
  checkIfPhoneNumberExists,
  getRandomString,
  prepareUserResponseData,
};
