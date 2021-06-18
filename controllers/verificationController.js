const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const EmailVerification = require('../models/EmailVerification');
const PhoneNumberVerification = require('../models/PhoneNumberVerification');
const User = require('../models/User');

const { sendVerificationMail } = require('../services/mailService');
const { sendOTP } = require('../services/smsService');

const { getExpiredDate } = require('../utils/getExpiredDate');
const { prepareUserResponseData } = require('../utils/user');
const { prepareVerificationMail } = require('../utils/verificationMail');
const { prepareVerificationSMS } = require('../utils/verificationSMS');

const secret = process.env.APP_SECRET;

const verifyEmail = async (req, res) => {
  const { token } = req.body;

  let userId;
  try {
    ({ userId } = jwt.verify(token, secret));
    if (!userId) throw Error('No user id.');
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        token: ['Invalid token.'],
      },
    });
  }

  let user = await User.findOne({
    _id: userId,
  });

  if (!user) {
    console.log('userId: ', userId);
    return res.status(400).json({
      errors: {
        token: ['Invalid token.'],
      },
    });
  }

  let emailVerification;
  try {
    emailVerification = await EmailVerification.findOne({
      userId,
    });
    if (!emailVerification) throw Error();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        token: ['Token is invalid.'],
      },
    });
  }

  const expiredDate = getExpiredDate(
    emailVerification.verifiedAt,
    1 * 24 * 60 * 60 * 1000
  );

  if (expiredDate.getTime() < Date.now()) {
    await EmailVerification.deleteOne({
      _id: emailVerification._id,
    });

    return res.status(410).json({
      errors: {
        token: [`Token expired at ${expiredDate}.`],
      },
    });
  }

  user.emailVerifiedAt = Date.now();
  await user.save();

  await EmailVerification.deleteOne({
    _id: emailVerification._id,
  });

  const jwtToken = jwt.sign({ userId: user._id }, secret);

  return res.status(200).json({
    data: {
      user: prepareUserResponseData(user),
      token: jwtToken,
    },
  });
};

const verifyPhoneNumber = async (req, res) => {
  const { otp, userId } = req.body;

  if (!otp) {
    return res.status(400).json({
      errors: {
        otp: ['OTP is required.'],
      },
    });
  }

  if (!userId) {
    return res.status(400).json({
      errors: {
        userId: ['User id is required.'],
      },
    });
  }

  let phoneNumberVerification;
  try {
    phoneNumberVerification = await PhoneNumberVerification.findOne({
      userId,
    });
    if (!phoneNumberVerification) throw Error();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        userId: ['User id is invalid.'],
      },
    });
  }

  const expiredDate = getExpiredDate(
    phoneNumberVerification.createdAt,
    10 * 60 * 1000
  );

  if (expiredDate.getTime() < Date.now()) {
    await PhoneNumberVerification.deleteOne({
      _id: phoneNumberVerification._id,
    });

    return res.status(410).json({
      errors: {
        userId: [`OTP expired at ${expiredDate}.`],
      },
    });
  }

  let isOtpCorrect;
  try {
    isOtpCorrect = await bcrypt.compare(otp, phoneNumberVerification.secret);
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        otp: ['OTP is invalid.'],
      },
    });
  }

  if (!isOtpCorrect) {
    return res.status(400).json({
      errors: {
        otp: ['OTP is incorrect.'],
      },
    });
  }

  let user;
  try {
    user = await User.findOne({
      _id: userId,
    });
    if (!user) throw Error();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        userId: ['User id is invalid.'],
      },
    });
  }

  user.phoneNumberVerifiedAt = Date.now();
  await user.save();

  await PhoneNumberVerification.deleteOne({
    _id: phoneNumberVerification._id,
  });

  const secret = process.env.APP_SECRET;
  const token = jwt.sign({ userId: user._id }, secret);

  return res.status(200).json({
    data: {
      user: prepareUserResponseData(user),
      token,
    },
  });
};

const sendNewEmail = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      errors: {
        userId: ['User id is required.'],
      },
    });
  }

  let user;
  try {
    user = User.findOne({
      _id: userId,
    });
    if (!user) throw Error();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        userId: ['Invalid user id.'],
      },
    });
  }

  if (user.emailVerifiedAt) {
    return res.status(200).json({
      messages: [
        'Email is already verified',
        `Email verified at ${user.emailVerifiedAt}`,
      ],
    });
  }

  // delete previous email token if exists
  if (await EmailVerification.exists({ userId: user._id })) {
    await EmailVerification.deleteOne({ userId: user._id });
  }

  try {
    const verificationEndPoint = await prepareVerificationMail(user._id);
    sendVerificationMail({
      to: user.email,
      verificationEndPoint,
      username: user.username,
    });
  } catch (err) {
    return res.status(500).end();
  }

  return res.status(200).end();
};

const sendNewOTP = async (req, res) => {
  const { userId } = req.body;

  let user;

  try {
    user = await User.findOne({
      _id: userId,
    });
    if (!user) throw Error();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        userId: ['Invalid user id'],
      },
    });
  }

  if (user.phoneNumberVerifiedAt) {
    return res.status(200).json({
      messages: [
        'Phone number is already verified',
        `Phone number verified at ${user.phoneNumberVerifiedAt}`,
      ],
    });
  }

  // delete previous otp token if exists
  if (await PhoneNumberVerification.exists({ userId: user._id })) {
    await PhoneNumberVerification.deleteOne({ userId: user._id });
  }

  try {
    const otp = await prepareVerificationSMS(user._id);
    sendOTP({ to: user.phoneNumber, otp });
  } catch (err) {
    return res.status(500).end();
  }

  return res.status(200).end();
};

module.exports = {
  verifyEmail,
  sendNewEmail,
  verifyPhoneNumber,
  sendNewOTP,
};
