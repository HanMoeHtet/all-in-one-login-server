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
  INVALID_OAUTH_PROVIDER,
  UNAUTHORIZED,
  INVALID_OAUTH_STATE,
} = require('../constants/errorTypes');

const {
  checkIfUsernameExists,
  checkIfEmailExists,
  checkIfPhoneNumberExists,
  getRandomString,
  prepareUserResponseData,
} = require('../utils/user');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const EmailVerification = require('../models/EmailVerification');
const PhoneNumberVerification = require('../models/PhoneNumberVerification');
const { sendOTP } = require('../services/smsService');
const { prepareVerificationMail } = require('../utils/verificationMail');
const { prepareVerificationSMS } = require('../utils/verificationSMS');
const { getExpiredDate } = require('../utils/getExpiredDate');
const axios = require('axios');
const { prepareOAuthVerification } = require('../utils/oAuthVerification');
const {
  validateUsername,
  validatePassword,
  validatePasswordConfirmation,
  validateEmail,
} = require('../utils/userValidation');

const signUp = async (req, res) => {
  const {
    authType,
    username,
    password,
    passwordConfirmation,
    email,
    phoneNumber,
    oAuthProvider,
  } = req.body;

  if (authType === authTypes.OAUTH) {
    if (!oAuthProvider) {
      return res.status(400).json({
        error: INVALID_OAUTH_PROVIDER,
        message:
          'OAuth provider name must be provided and must be a valid one.',
      });
    }

    const oAuthConsentUrl = await prepareOAuthVerification(oAuthProvider);

    return res.status(200).json({
      data: {
        oAuthConsentUrl,
      },
      message: 'Please follow the OAuth consent screen url and grant access.',
    });
  }

  if (!username) {
    return res.status(400).json({
      error: INVALID_USERNAME,
      message: 'Username must be provided and must be a valid name',
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
      data: prepareUserResponseData(user),
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
      data: prepareUserResponseData(user),
      message: [
        'User successfully created.',
        `Verification code sent to ${phoneNumber}`,
      ],
    });
  }

  return res.status(404);
};

const signUpWithEmail = async (req, res) => {
  const { username, password, passwordConfirmation, email } = req.body;

  const errors = {
    username: [],
    email: [],
    password: [],
    passwordConfirmation: [],
  };

  let [isValid, messages] = validateUsername(username, { required: true });

  if (!isValid) {
    errors.username.push(...messages);
  } else {
    let exists;
    [exists, messages] = await checkIfUsernameExists(email);
    if (exists) errors.username.push(...messages);
  }

  [isValid, messages] = validatePassword(password, { required: true });

  if (!isValid) {
    errors.password.push(...messages);
  }

  [isValid, messages] = validatePasswordConfirmation(
    passwordConfirmation,
    password,
    {
      required: true,
    }
  );

  if (!isValid) {
    errors.passwordConfirmation.push(...messages);
  }

  [isValid, messages] = validateEmail(email, { required: true });

  if (!isValid) {
    errors.email.push(...messages);
  } else {
    let exists;
    [exists, messages] = await checkIfEmailExists(email);
    if (exists) errors.email.push(...messages);
  }

  if (!isValid) {
    return res.status(400).json({
      errors,
    });
  }

  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(password, salt);

  const user = new User({
    username,
    email,
    hash,
  });

  try {
    await user.save();
  } catch (err) {
    console.log(err);
    return res.status(500);
  }

  const secret = process.env.APP_SECRET;
  const token = jwt.sign({ userId: user._id }, secret);

  const verificationEndPoint = await prepareVerificationMail(user._id);

  sendVerificationMail({
    to: email,
    verificationEndPoint,
  });

  return res.status(200).json({
    data: {
      user: prepareUserResponseData(user),
      token,
    },
  });
};

const signUpWithPhoneNumber = async (req, res) => {
  const { username, password, passwordConfirmation, phoneNumber, countryCode } = req.body;

  const errors = {
    username: [],
    email: [],
    password: [],
    passwordConfirmation: [],
  };

  let [isValid, messages] = validateUsername(username, { required: true });

  if (!isValid) {
    errors.username.push(...messages);
  } else {
    let exists;
    [exists, messages] = await checkIfUsernameExists(email);
    if (exists) errors.username.push(...messages);
  }

  [isValid, messages] = validatePassword(password, { required: true });

  if (!isValid) {
    errors.password.push(...messages);
  }

  [isValid, messages] = validatePasswordConfirmation(
    passwordConfirmation,
    password,
    {
      required: true,
    }
  );

  if (!isValid) {
    errors.passwordConfirmation.push(...messages);
  }

  [isValid, messages] = validateEmail(email, { required: true });

  if (!isValid) {
    errors.email.push(...messages);
  } else {
    let exists;
    [exists, messages] = await checkIfEmailExists(email);
    if (exists) errors.email.push(...messages);
  }

  if (!isValid) {
    return res.status(400).json({
      errors,
    });
  }

  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(password, salt);

  const user = new User({
    username,
    email,
    hash,
  });

  try {
    await user.save();
  } catch (err) {
    console.log(err);
    return res.status(500);
  }

  const secret = process.env.APP_SECRET;
  const token = jwt.sign({ userId: user._id }, secret);

  const verificationEndPoint = await prepareVerificationMail(user._id);

  sendVerificationMail({
    to: email,
    verificationEndPoint,
  });

  return res.status(200).json({
    data: {
      user: prepareUserResponseData(user),
      token,
    },
  });
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

/**
 * TODO: Protect the route with CORS
 * TODO: Create user
 * TODO: Refused to login
 */

// const clientUrl = `https://github.com/login/oauth/authorize?client_id=&redirect_uri=`;

const signInWithGithub = async (req, res) => {
  const { error, error_description, error_uri } = req.query;
  if (error) {
    return res.status(401).json({
      error,
      error_description,
      error_uri,
    });
  }

  const { state, code } = req.query;

  try {
    const secret = process.env.APP_SECRET;
    jwt.verify(state, secret);
  } catch (err) {
    return res.status(403).json({
      error: INVALID_OAUTH_STATE,
      message: 'Access denied. Please log in.',
    });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  // const redirectUri = `${process.env.APP_URL}`;

  const exchangeTokenUrl = `https://github.com/login/oauth/access_token?code=${code}&client_id=${clientId}&client_secret=${clientSecret}`;
  let tokenResponse;
  try {
    tokenResponse = await axios.post(
      exchangeTokenUrl,
      {},
      { headers: { Accept: 'application/json ' } }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: UNKNOWN_ERROR,
      message: 'An error ocurred.',
    });
  }

  const { access_token, token_type, scope } = tokenResponse.data;

  const url = 'https://api.github.com/user';
  let response;
  try {
    response = await axios.get(url, {
      headers: { Authorization: `${token_type} ${access_token}` },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: UNKNOWN_ERROR,
      message: 'An error ocurred.',
    });
  }

  let { login: username, email, avatar_url: avatar } = response.data;

  if (await User.exists({ username })) {
    username += getRandomString();
  }

  const user = new User({
    username,
    oAuthAccessToken: access_token,
    oAuthTokenType: token_type,
  });

  if (email) {
    user.email = email;
  }

  if (avatar) {
    user.avatar = avatar;
  }

  try {
    await user.save();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: UNKNOWN_ERROR,
      message: 'An error ocurred.',
    });
  }

  return res.status(200).json({
    data: prepareUserResponseData(user),
    message: 'User successfully created.',
  });
};

// const clientUrl = `https://www.facebook.com/v11.0/dialog/oauth?client_id=&redirect_uri=&state=`

const signInWithFacebook = async (req, res) => {
  const { error_reason, error, error_description } = req.query;

  if (error) {
    console.log(err, error_reason, error_description);
    return res.status(400).json({
      err,
      error_reason,
      error_description,
    });
  }

  const { state, code } = req.query;

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const redirectUri = `${process.env.APP_URL}/signInWithFacebook`;
  const exchangeTokenUrl = `https://graph.facebook.com/v11.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`;

  const exchangeTokenResponse = await axios.get(exchangeTokenUrl);
  const { access_token, token_type, expires_in } = exchangeTokenResponse.data;

  const url = `https://graph.facebook.com/v11.0/me?access_token=${access_token}&fields=email,name`;
  let response;
  try {
    response = await axios.get(url);
  } catch (err) {
    return res.status(400).json(err.response.data);
  }
  return res.status(200).json(response.data);
};

// const clientUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=&redirect_uri=&response_type=code&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`;

const signInWithGoogle = async (req, res) => {
  const { error } = req.query;

  if (error) {
    console.log(err);
    return res.status(400).json({
      error,
    });
  }

  const { code } = req.query;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.APP_URL}/signInWithGoogle`;
  const exchangeTokenUrl = `https://oauth2.googleapis.com/token?code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&grant_type=authorization_code`;

  const exchangeTokenResponse = await axios.post(exchangeTokenUrl);

  const { access_token, token_type, scope, expires_in } =
    exchangeTokenResponse.data;

  const url = 'https://www.googleapis.com/oauth2/v2/userinfo';
  const response = await axios.get(url, {
    headers: { Authorization: `${token_type} ${access_token}` },
  });

  console.log(response.data);
  return res.status(200).json(response.data);
};

module.exports = {
  signUp,
  signUpWithEmail,
  signUpWithPhoneNumber
  verifyEmail,
  sendNewEmail,
  verifyPhoneNumber,
  sendNewOTP,
  signInWithGithub,
  signInWithFacebook,
  signInWithGoogle,
};
