const { DUPLICATE_USERNAME } = require("../constants/errorTypes");
const { checkIfUsernameExists } = require("../utils/user");

const validateUsername = async (req, res) => {
  const { username } = req.body;
  if(await checkIfUsernameExists(username)) {
    return res.status(409).json({
      error: DUPLICATE_USERNAME,
      message: 'A user with that username already exists.'
    })
  }

  return res.status(200).json({
    message: 'Username is valid',
  })
}

const validateEmail = async (req, res) => {
  const { email } = req.body;
}

const validatePhoneNumber = async (req, res) => {
  const { phoneNumber } = req.body;
}

module.exports = {
  validateUsername,
  validateEmail,
  validatePhoneNumber
}