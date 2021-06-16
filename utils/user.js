const User = require('../models/User');

const checkIfUsernameExists = async (username) => {
  if (
    await User.exists({
      username,
    })
  ) {
    return [true, ['A user with that username exists.']];
  }

  return [false, []];
};

const checkIfEmailExists = async (email) => {
  if (
    await User.exists({
      email,
    })
  ) {
    return [true, ['A user with that email exists.']];
  }

  return [false, []];
};

const checkIfPhoneNumberExists = async (phoneNumber) => {
  if (
    await User.exists({
      phoneNumber,
    })
  ) {
    return [true, ['A user with that phone number exists.']];
  }

  return [false, []];
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
