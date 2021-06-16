const { checkIfUsernameExists, checkIfEmailExists } = require('../utils/user');
const {
  validateUsername: validateUsernameHelper,
  validateEmail: validateEmailHelper,
} = require('../utils/userValidation');

const validateUsername = async (req, res) => {
  const { username } = req.body;
  let [isValid, messages] = validateUsernameHelper(username);

  if (!isValid) {
    return res.status(400).json({
      errors: {
        username: messages,
      },
    });
  }

  let exists;
  [exists, messages] = await checkIfUsernameExists(username);
  if (exists) {
    return res.status(409).json({
      errors: {
        username: messages,
      },
    });
  }
  return res.status(204).send();
};

const validateEmail = async (req, res) => {
  const { email } = req.body;

  let [isValid, messages] = validateEmailHelper(email);

  if (!isValid) {
    return res.status(400).json({
      errors: {
        email: messages,
      },
    });
  }

  let exists;
  [exists, messages] = await checkIfEmailExists(email);

  if (exists) {
    return res.status(409).json({ errors: { email: messages } });
  }

  return res.status(204).send();
};

const validatePhoneNumber = async (req, res) => {
  const { phoneNumber } = req.body;
};

module.exports = {
  validateUsername,
  validateEmail,
  validatePhoneNumber,
};
