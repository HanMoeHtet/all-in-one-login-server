const PhoneNumberVerification = require('../models/PhoneNumberVerification');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prepareVerificationSMS = async () => {
  const otp = Array(6)
    .fill(0)
    .map((_) => Math.floor(Math.random() * 10))
    .join('');

  const secret = await bcrypt.hash(otp, 10);

  phoneNumberVerification = new PhoneNumberVerification({
    userId,
    secret,
  });
  await phoneNumberVerification.save();

  const token = jwt.sign({ userId }, salt, {
    expiresIn: '1d',
  });

  jwt.verify();

  return {
    otp,
    phoneNumberVerificationId: phoneNumberVerification._id,
  };
};

module.exports = {
  prepareVerificationSMS,
};
