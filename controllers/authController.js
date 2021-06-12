const authTypes = require('../constants/authTypes');
const { sendVerificationMail } = require('../services/mailService');
const User = require('../models/User');
const {
  DUPLICATE_USERNAME,
  DUPLICATE_EMAIL,
  INVALID_EMAIL,
  INVALID_PASSWORD,
  PASSWORDS_MISMATCH,
  INVALID_EMAIL_VERIFICATION_TOKEN,
  UNKNOWN_ERROR,
  EMAIL_VERIFICATION_TOKEN_EXPIRED,
  DUPLICATE_PHONE_NUMBER,
  INVALID_PHONE_NUMBER_VERIFICATION_TOKEN,
  INCORRECT_OTP,
  INVALID_USER_ID,
  INVALID_EMAIL_VERIFICATION_ID,
  INVALID_PHONE_NUMBER,
  INVALID_USERNAME,
} = require('../constants/errorTypes');
const {
  checkIfUsernameExists,
  checkIfEmailExists,
  checkIfPhoneNumberExists,
} = require('../utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const EmailVerification = require('../models/EmailVerification');
const PhoneNumberVerification = require('../models/PhoneNumberVerification');
const { sendOTP } = require('../services/smsService');
const { prepareVerificationMail } = require('../utils/verificationMail');
const { prepareVerificationSMS } = require('../utils/verificationSMS');
const { getExpiredDate } = require('../utils/getExpiredDate');
require('dotenv').config();

const signUp = async (req, res) => {
  const {
    authType,
    username,
    password,
    passwordConfirmation,
    email,
    phoneNumber,
  } = req.body;

  if (!username) {
    return res.status(400).json({
      error: INVALID_USERNAME,
      message: 'Usernaem must be provided and must be a valid name',
    });
  }

  if (await checkIfUsernameExists(username)) {
    return res.status(409).json({
      error: DUPLICATE_USERNAME,
      message: 'A user with that username already exists.',
    });
  }

  if (!password) {
    return res.status(400).json({
      error: INVALID_PASSWORD,
      message: 'Password must be provided and must be valid',
    });
  }

  if (password !== passwordConfirmation) {
    return res.status(400).json({
      error: PASSWORDS_MISMATCH,
      message: 'Password and confirmed password are not equal.',
    });
  }

  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(password, salt);

  if (authType === authTypes.EMAIL) {
    if (!email) {
      return res.status(400).json({
        error: INVALID_EMAIL,
        message: 'Email must be provided and must be a valid address.',
      });
    }

    if (await checkIfEmailExists(email)) {
      return res.status(409).json({
        error: DUPLICATE_EMAIL,
        message: 'A user with that email already exists.',
      });
    }

    const user = new User({
      username,
      email,
      salt,
      hash,
    });

    try {
      await user.save();
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        error: UNKNOWN_ERROR,
        message: 'An error occurred. Please try again.',
      });
    }

    const verificationEndPoint = await prepareVerificationMail(user._id);

    sendVerificationMail({
      to: email,
      verificationEndPoint,
    });

    return res.status(200).json({
      data: user,
      message: [
        'User successfully created.',
        `Verification email sent to ${email}`,
      ],
    });
  }

  if (authType === authTypes.PHONE_NUMBER) {
    if (!phoneNumber) {
      return res.status(400).json({
        error: INVALID_PHONE_NUMBER,
        message: 'Phone number must be provided and must be a valid number',
      });
    }

    if (await checkIfPhoneNumberExists(phoneNumber)) {
      return res.status(409).json({
        error: DUPLICATE_PHONE_NUMBER,
        message: 'A User with that phone number already exists.',
      });
    }

    const user = new User({
      username,
      phoneNumber,
      salt,
      hash,
    });

    try {
      await user.save();
    } catch (err) {
      return res.status(500).json({
        error: UNKNOWN_ERROR,
        message: 'An error occurred.',
      });
    }

    let otp;
    try {
      otp = await prepareVerificationSMS(user._id);
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        error: UNKNOWN_ERROR,
        message: 'An error occurred.',
      });
    }

    sendOTP({ to: phoneNumber, otp });

    return res.status(200).json({
      data: user,
      message: [
        'User successfully created.',
        `Verification code sent to ${phoneNumber}`,
      ],
    });
  }

  return res.status(404);
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  let userId;
  try {
    ({ userId } = jwt.decode(token));
    if (!userId) throw new Error();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: INVALID_EMAIL_VERIFICATION_TOKEN,
      message:
        'Token for email verification is invalid. Make sure you have provided a valid email address and check your inbox again.',
    });
  }

  let user = await User.findOne({
    _id: userId,
  });

  if (!user) {
    console.log('userId: ', userId);
    return res.status(400).json({
      error: INVALID_EMAIL_VERIFICATION_ID,
      message:
        'Email verification is invalid. Make sure you have provided a valid email address and check your inbox again.',
    });
  }

  if (user.emailVerifiedAt) {
    return res.status(200).json({
      data: {
        emailVerifiedAt: user.emailVerifiedAt,
      },
      message: [
        'Email is already verified',
        `Email verified at ${user.emailVerifiedAt}`,
      ],
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
      error: INVALID_EMAIL_VERIFICATION_ID,
      message:
        'Email verification is invalid. Make sure you have provided a valid email address and check your inbox again.',
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
      error: EMAIL_VERIFICATION_TOKEN_EXPIRED,
      message: `Token for email verification expired at ${err.expiredAt}.`,
    });
  }

  try {
    jwt.verify(token, emailVerification.secret);
  } catch (err) {
    return res.status(400).json({
      error: INVALID_EMAIL_VERIFICATION_TOKEN,
      message:
        'Token for email verification is invalid. Make sure you have provided a valid email address and check your inbox again.',
    });
  }

  await EmailVerification.deleteOne({
    _id: emailVerification._id,
  });

  user.emailVerifiedAt = Date.now();
  await user.save();

  return res.status(200).json({
    data: {
      emailVerifiedAt: user.emailVerifiedAt,
    },
    message: `Email verified at ${user.emailVerifiedAt}`,
  });
};

const sendNewEmail = async (req, res) => {
  if (req.user.emailVerifiedAt) {
    return res.status(200).json({
      data: {
        emailVerifiedAt: req.user.emailVerifiedAt,
      },
      message: [
        'Email is already verified',
        `Email verified at ${req.user.emailVerifiedAt}`,
      ],
    });
  }

  // delete previous email token if exists
  if (await EmailVerification.exists({ userId: req.user._id })) {
    await EmailVerification.deleteOne({ userId: req.user._id });
  }

  const verificationEndPoint = await prepareVerificationMail(req.user._id);

  sendVerificationMail({
    to: req.user.email,
    verificationEndPoint,
  });

  return res.status(200).json({
    data: {},
    message: `Verification email sent to ${req.user.email}`,
  });
};

const verifyPhoneNumber = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({
      error: INVALID_PHONE_NUMBER_VERIFICATION_TOKEN,
      message:
        'Phone number verification is invalid. Make sure you have provided a valid phone number and check your inbox again.',
    });
  }

  const phoneNumberVerification = await PhoneNumberVerification.findOne({
    userId: req.user._id,
  });

  if (!phoneNumberVerification) {
    return res.status(400).json({
      error: INVALID_PHONE_NUMBER_VERIFICATION_TOKEN,
      message:
        'Phone number verification is invalid. Make sure you have provided a valid phone number and check your inbox again.',
    });
  }

  const expiredDate = getExpiredDate(
    phoneNumberVerification.createdAt,
    10 * 60 * 1000
  );

  if (expiredDate.getTime() < Date.now()) {
    await EmailVerification.deleteOne({
      _id: phoneNumberVerification._id,
    });

    return res.status(410).json({
      error: EMAIL_VERIFICATION_TOKEN_EXPIRED,
      message: `Token for email verification expired at ${err.expiredAt}.`,
    });
  }

  let isOtpCorrect;
  try {
    isOtpCorrect = await bcrypt.compare(otp, phoneNumberVerification.secret);
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: UNKNOWN_ERROR,
      message: 'An error ocurred.',
    });
  }

  if (!isOtpCorrect) {
    return res.status(400).json({
      error: INCORRECT_OTP,
      message:
        'OTP is not correct. Please check your inbox again or get a new code.',
    });
  }

  await PhoneNumberVerification.deleteOne({
    _id: phoneNumberVerification._id,
  });

  req.user.phoneNumberVerifiedAt = Date.now();
  await req.user.save();

  return res.status(200).json({
    data: {
      phoneNumberVerifiedAt: req.user.phoneNumberVerifiedAt,
    },
    message: `Phone number verified at ${req.user.phoneNumberVerifiedAt}`,
  });
};

const sendNewOTP = async (req, res) => {
  if (req.user.phoneNumberVerifiedAt) {
    return res.status(200).json({
      data: {
        phoneNumberVerifiedAt: req.user.phoneNumberVerifiedAt,
      },
      message: [
        'Phone number is already verified',
        `Phone number verified at ${req.user.phoneNumberVerifiedAt}`,
      ],
    });
  }

  // delete previous otp token if exists
  if (await PhoneNumberVerification.exists({ userId: req.user._id })) {
    await PhoneNumberVerification.deleteOne({ userId: req.user._id });
  }

  const otp = await prepareVerificationSMS(req.user._id);

  sendOTP({
    to: req.user.phoneNumber,
    otp,
  });

  return res.status(200).json({
    data: {},
    message: `Verification code sent to ${req.user.phoneNumber}`,
  });
};

module.exports = {
  signUp,
  verifyEmail,
  sendNewEmail,
  verifyPhoneNumber,
  sendNewOTP,
};
