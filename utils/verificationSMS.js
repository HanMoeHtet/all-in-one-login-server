const PhoneNumberVerification = require('../models/PhoneNumberVerification');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prepareVerificationSMS = async (userId) => {
  const otp = Array(6)
    .fill(0)
    .map((_) => Math.floor(Math.random() * 10))
    .join('');

  const secret = await bcrypt.hash(otp, 10);

  const phoneNumberVerification = new PhoneNumberVerification({
    userId,
    secret,
  });

  await phoneNumberVerification.save();

  return otp;
};

module.exports = {
  prepareVerificationSMS,
};
