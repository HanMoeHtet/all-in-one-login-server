const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PhoneNumberVerification = require('../models/PhoneNumberVerification');

const OTP_LENGTH = 6;

const prepareVerificationSMS = async (userId) => {
  const otp = Array(OTP_LENGTH)
    .fill(0)
    .map((_) => Math.floor(Math.random() * 10))
    .join('');

  const secret = await bcrypt.hash(otp, 10);

  const phoneNumberVerification = new PhoneNumberVerification({
    userId,
    secret,
  });

  try {
    await phoneNumberVerification.save();
  } catch (err) {
    console.log(err);
    throw Error();
  }

  return otp;
};

module.exports = {
  prepareVerificationSMS,
};
