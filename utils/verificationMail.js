require('dotenv').config();
const bcrypt = require('bcrypt');
const EmailVerification = require('../models/EmailVerification');
const jwt = require('jsonwebtoken');

const prepareVerificationMail = async (userId) => {
  const salt = await bcrypt.genSalt();
  emailVerification = new EmailVerification({
    userId,
    secret: salt,
  });
  await emailVerification.save();
  const token = jwt.sign({ userId }, salt, {
    expiresIn: '1d',
  });

  const clientEmailVerificationEndpoint =
    process.env.CLIENT_EMAIL_VERIFICATION_ENDPOINT;
  const verificationEndPoint = `${clientEmailVerificationEndpoint}?token=${token}`;

  return verificationEndPoint;
};

module.exports = {
  prepareVerificationMail,
};
