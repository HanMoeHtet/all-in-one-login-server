const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const EmailVerification = require('../models/EmailVerification');

const secret = process.env.APP_SECRET;

const prepareVerificationMail = async (userId) => {
  const emailVerification = new EmailVerification({
    userId,
  });

  let token;

  try {
    await emailVerification.save();
    token = jwt.sign({ userId }, secret);
  } catch (err) {
    console.log(err);
    throw Error();
  }

  const clientEmailVerificationEndpoint =
    process.env.CLIENT_EMAIL_VERIFICATION_ENDPOINT;
  const verificationEndPoint = `${clientEmailVerificationEndpoint}?token=${token}`;

  return verificationEndPoint;
};

module.exports = {
  prepareVerificationMail,
};
