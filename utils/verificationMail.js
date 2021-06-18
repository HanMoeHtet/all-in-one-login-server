const bcrypt = require('bcrypt');
const EmailVerification = require('../models/EmailVerification');
const jwt = require('jsonwebtoken');

const prepareVerificationMail = async (userId) => {
  const secret = process.env.APP_SECRET;
  const emailVerification = new EmailVerification({
    userId,
  });
  await emailVerification.save();

  const token = jwt.sign({ userId }, secret);

  const clientEmailVerificationEndpoint =
    process.env.CLIENT_EMAIL_VERIFICATION_ENDPOINT;
  const verificationEndPoint = `${clientEmailVerificationEndpoint}?token=${token}`;

  return verificationEndPoint;
};

module.exports = {
  prepareVerificationMail,
};
