const {
  DUPLICATE_USERNAME,
  DUPLICATE_EMAIL,
  INVALID_USERNAME,
} = require('../constants/errorTypes');
const { checkIfUsernameExists, checkIfEmailExists } = require('../utils/user');
const {
  validateUsername: validateUsernameHelper,
  validateEmail: validateEmailHelper,
} = require('../utils/userValidation');

const validateUsername = async (req, res) => {
  const { username } = req.body;

  const [isValid, message] = validateUsernameHelper(username);

  if (!isValid) {
    return res.status(400).json({
      error: INVALID_USERNAME,
      message,
    });
  }

  if (await checkIfUsernameExists(username)) {
    return res.status(409).json({
      error: DUPLICATE_USERNAME,
      message: 'A user with that username already exists.',
    });
  }

  return res.status(200).json({
    message: 'Username is valid',
  });
};

const validateEmail = async (req, res) => {
  const { email } = req.body;

  const [isValid, message] = validateEmailHelper(email);

  if (!isValid) {
    return res.status(400).json({
      error: INVALID_EMAIL,
      message,
    });
  }

  if (await checkIfEmailExists(email)) {
    return res.status(409).json({
      error: DUPLICATE_EMAIL,
      message: 'A user with that email already exists.',
    });
  }

  return res.status(200).json({
    message: 'Email is valid',
  });
};

const validatePhoneNumber = async (req, res) => {
  const { phoneNumber } = req.body;
};

module.exports = {
  validateUsername,
  validateEmail,
  validatePhoneNumber,
};
