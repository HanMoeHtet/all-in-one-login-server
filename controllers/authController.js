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
} = require('../constants/errorTypes');
const { checkIfUsernameExists, checkIfEmailExists } = require('../utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const EmailVerification = require('../models/EmailVerification');
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

  if (await checkIfUsernameExists(username)) {
    return res.status(409).json({
      error: DUPLICATE_USERNAME,
      message: 'A user with that username already exists.',
    });
  }

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

    const emailVerification = new EmailVerification({
      secret: salt,
    });
    await emailVerification.save();

    const token = jwt.sign(
      { userId: user._id, emailVerificationId: emailVerification._id },
      salt,
      { expiresIn: '1d' }
    );

    const clientEmailVerificationEndpoint =
      process.env.CLIENT_EMAIL_VERIFICATION_ENDPOINT ||
      `${req.hostname}/verifyEmail`;
    const verificationEndPoint = `${clientEmailVerificationEndpoint}?token=${token}`;

    sendVerificationMail({
      to: email,
      token,
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

  return res.status(404);
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  let userId, emailVerificationId;
  try {
    ({ userId, emailVerificationId } = jwt.decode(token));
    if (!userId || !emailVerificationId) throw new Error();
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
      error: INVALID_EMAIL_VERIFICATION_TOKEN,
      message:
        'Token for email verification is invalid. Make sure you have provided a valid email address and check your inbox again.',
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
      _id: emailVerificationId,
    });
    if (!emailVerification) throw Error();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: INVALID_EMAIL_VERIFICATION_TOKEN,
      message:
        'Token for email verification is invalid. Make sure you have provided a valid email address and check your inbox again.',
    });
  }

  try {
    jwt.verify(token, emailVerification.secret);
  } catch (err) {
    console.log(err);
    if (err instanceof jwt.TokenExpiredError) {
      await EmailVerification.deleteOne({
        _id: emailVerification._id,
      });

      const salt = await bcrypt.genSalt();
      emailVerification = new EmailVerification({
        secret: salt,
      });
      await emailVerification.save();
      const token = jwt.sign(
        { userId: user._id, emailVerificationId: emailVerification._id },
        salt,
        {
          expiresIn: '1d',
        }
      );

      const clientEmailVerificationEndpoint =
        process.env.CLIENT_EMAIL_VERIFICATION_ENDPOINT ||
        `${req.hostname}/verifyEmail`;
      const verificationEndPoint = `${clientEmailVerificationEndpoint}?token=${token}`;

      sendVerificationMail({
        to: user.email,
        token,
        verificationEndPoint,
      });
      return res.status(410).json({
        error: EMAIL_VERIFICATION_TOKEN_EXPIRED,
        message: [
          `Token for email verification expired at ${err.expiredAt}.`,
          'Check your inbox for a new email from %appname%',
        ],
      });
    }
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

module.exports = {
  signUp,
  verifyEmail,
};
