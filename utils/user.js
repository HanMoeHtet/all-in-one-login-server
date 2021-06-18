const getRandomString = (length = 3) => {
  return Array(length)
    .fill(0)
    .map((_) => Math.floor(Math.random() * 10))
    .join('');
};

const prepareUserResponseData = (user, { email, phoneNumber } = {}) => {
  const response = {
    userId: user._id,
    username: user.username,
    avatar: user.avatar,
  };

  if (email) {
    response.email = user.email;
  }

  if (phoneNumber) {
    response.phoneNumber = user.phoneNumber;
  }

  return response;
};

module.exports = {
  getRandomString,
  prepareUserResponseData,
};
