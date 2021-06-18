const {
  checkIfUsernameExists,
  checkIfEmailExists,
  checkIfPhoneNumberExists,
  validateUsername: validateUsernameHelper,
  validateEmail: validateEmailHelper,
  validatePhoneNumber: validatePhoneNumberHelper,
} = require('../utils/userValidation');

const validateUsername = async (req, res) => {
  const { username, required = false } = req.body;
  let [isValid, messages] = validateUsernameHelper(username, required);

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
  const { email, required = false } = req.body;

  let [isValid, messages] = validateEmailHelper(email, required);

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
  const { phoneNumber, required = false } = req.body;

  let [isValid, messages] = validatePhoneNumberHelper(phoneNumber, required);

  if (!isValid) {
    return res.status(400).json({
      errors: {
        phoneNumber: messages,
      },
    });
  }

  let exists;
  [exists, messages] = await checkIfPhoneNumberExists(phoneNumber);

  if (exists) {
    return res.status(409).json({ errors: { phoneNumber: messages } });
  }

  return res.status(204).send();
};

module.exports = {
  validateUsername,
  validateEmail,
  validatePhoneNumber,
};
