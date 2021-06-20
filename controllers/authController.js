const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const { sendVerificationMail } = require('../services/mailService');
const { sendOTP } = require('../services/smsService');

const { prepareVerificationMail } = require('../utils/verificationMail');
const { prepareVerificationSMS } = require('../utils/verificationSMS');
const { getRandomString, prepareUserResponseData } = require('../utils/user');
const { prepareOAuthVerification } = require('../utils/oAuthVerification');
const {
  validateEmailSignUp,
  validatePhoneNumberSignUp,
} = require('../utils/userValidation');

const axios = require('axios');

const secret = process.env.APP_SECRET;

const signUpWithEmail = async (req, res) => {
  const { username, password, passwordConfirmation, email } = req.body;

  const [isValid, errors] = await validateEmailSignUp({
    username,
    password,
    passwordConfirmation,
    email,
  });

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
    return res.status(500).end();
  }

  try {
    const verificationEndPoint = await prepareVerificationMail(user._id);
    sendVerificationMail({
      to: email,
      verificationEndPoint,
      username: user.username,
    });
  } catch (err) {
    return res.status(500).end();
  }

  return res.status(200).json({
    data: {
      userId: user._id,
      email: user.email,
    },
  });
};

const signUpWithPhoneNumber = async (req, res) => {
  let { username, password, passwordConfirmation, phoneNumber, countryCode } =
    req.body;

  phoneNumber = countryCode + phoneNumber;

  const [isValid, errors] = await validatePhoneNumberSignUp({
    username,
    password,
    passwordConfirmation,
    phoneNumber,
    countryCode,
  });

  if (!isValid) {
    return res.status(400).json({
      errors,
    });
  }

  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(password, salt);

  const user = new User({
    username,
    phoneNumber,
    hash,
  });

  try {
    await user.save();
  } catch (err) {
    console.log(err);
    return res.status(500).end();
  }

  try {
    const otp = await prepareVerificationSMS(user._id);
    sendOTP({ to: phoneNumber, otp });
  } catch (err) {
    return res.status(500).end();
  }

  const jwtToken = jwt.sign({ userId: user._id }, secret);

  return res.status(200).json({
    data: {
      userId: user._id,
      phoneNumber: user.phoneNumber,
    },
  });
};

const signInWithOAuth = async (req, res) => {
  const { oAuthProvider } = req.body;

  if (!oAuthProvider) {
    return res.status(400).json({
      errors: {
        oAuthProvider: ['Oauth provider is required.'],
      },
    });
  }

  const oAuthConsentUrl = await prepareOAuthVerification(oAuthProvider);

  return res.status(200).json({
    data: {
      oAuthConsentUrl,
    },
  });
};

const signInWithToken = async (req, res) => {
  const { token } = req.body;

  let userId;
  try {
    ({ userId } = jwt.verify(token, secret));
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        token: ['Invalid token.'],
      },
    });
  }

  let user;
  try {
    user = await User.findOne({ _id: userId });
    if (!user) throw Error();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      errors: {
        token: ['Invalid token.'],
      },
    });
  }

  return res.status(200).json({
    data: {
      user: prepareUserResponseData(user),
    },
  });
};

const logIn = async (req, res) => {
  const { username, password } = req.body;

  let user;
  try {
    user = await User.findOne({
      username,
    });
    if (!user) throw Error();
  } catch (err) {
    console.log(err);
    return res.status(404).json({
      errors: {
        username: ['A user with that username does not exists.'],
      },
    });
  }

  let isPasswordCorrect;
  try {
    isPasswordCorrect = await bcrypt.compare(password, user.hash);
  } catch (err) {
    console.log(err);
    return res.status(500).end();
  }

  if (!isPasswordCorrect) {
    return res.status(401).json({
      errors: {
        password: ['Incorrect password.'],
      },
    });
  }

  const token = jwt.sign({ userId: user._id }, secret);

  return res.status(200).json({
    data: { user: prepareUserResponseData(user), token },
  });
};

const signInWithGithub = async (req, res) => {
  const { error, error_description, error_uri } = req.query;
  if (error) {
    console.log(error, error_description, error_uri);
    return res.status(401).json({
      messages: [error_description],
    });
  }

  const { state, code } = req.query;
  try {
    jwt.verify(state, secret);
  } catch (err) {
    return res.status(403).json({
      messages: ['Cross site requests are not allowed.'],
    });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const exchangeTokenUrl = `https://github.com/login/oauth/access_token?code=${code}&client_id=${clientId}&client_secret=${clientSecret}`;
  let tokenResponse;
  try {
    tokenResponse = await axios.post(
      exchangeTokenUrl,
      {},
      { headers: { Accept: 'application/json ' } }
    );
  } catch (err) {
    console.log(err?.response?.data);
    return res.status(400).json({
      errors: {
        code: ['Invalid code.'],
      },
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
    console.log(err?.respone?.data);
    return res.status(500).end();
  }

  let { login: username, email, avatar_url: avatar, id } = response.data;

  let user = User.findOne({ 'oAuth.id': id });
  if (user) {
    const jwtToken = jwt.sign({ userId: user._id }, secret);

    return res.status(200).json({
      data: {
        user: prepareUserResponseData(user),
        token: jwtToken,
      },
    });
  }

  if (email) {
    const user = User.findOne({ email });
    if (user) {
      user.oAuth = {
        id,
        provider: 'GITHUB',
        accessToken: access_token,
        tokenType: token_type,
      };
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }

      try {
        await user.save();
      } catch (err) {
        console.log(err);
        return res.status(500).end();
      }

      const jwtToken = jwt.sign({ userId: user._id }, secret);

      return res.status(200).json({
        data: {
          user: prepareUserResponseData(user),
          token: jwtToken,
        },
      });
    }
  }

  username = username.replace(/ /g, '_');
  if (await User.exists({ username })) {
    username += getRandomString();
  }

  user = new User({
    username,
    oAuth: {
      id,
      provider: 'GITHUB',
      accessToken: access_token,
      tokenType: token_type,
    },
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
    return res.status(500).end();
  }

  const secret = process.env.APP_SECRET;
  const jwtToken = jwt.sign({ userId: user._id }, secret);

  return res.status(200).json({
    data: {
      user: prepareUserResponseData(user),
      token: jwtToken,
    },
  });
};

const signInWithFacebook = async (req, res) => {
  const { error_reason, error, error_description } = req.query;

  if (error) {
    console.log(err, error_reason, error_description);
    return res.status(401).json({
      messages: [error_reason],
    });
  }

  const { state, code } = req.query;

  try {
    jwt.verify(state, secret);
  } catch (err) {
    return res.status(403).json({
      messages: ['Cross site requests are not allowed.'],
    });
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const redirectUri = `${process.env.CLIENT_ORIGIN}/signInWithFacebook`;
  const exchangeTokenUrl = `https://graph.facebook.com/v11.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`;

  let exchangeTokenResponse;
  try {
    exchangeTokenResponse = await axios.get(exchangeTokenUrl);
  } catch (err) {
    console.log(err?.response?.data);
    return res.status(400).json({
      code: ['Invalid code.'],
    });
  }

  const { access_token, token_type, expires_in } = exchangeTokenResponse.data;
  const url = `https://graph.facebook.com/v11.0/me?access_token=${access_token}&fields=email,name,picture,id`;
  let response;
  try {
    response = await axios.get(url);
  } catch (err) {
    console.log(err?.response?.data);
    return res.status(500).end();
  }
  let { name: username, email, picture, id } = response.data;
  const avatar = picture.is_silhouette ? null : picture.data.url;

  let user = User.findOne({ 'oAuth.id': id });
  if (user) {
    const jwtToken = jwt.sign({ userId: user._id }, secret);

    return res.status(200).json({
      data: {
        user: prepareUserResponseData(user),
        token: jwtToken,
      },
    });
  }

  if (email) {
    const user = User.findOne({ email });
    if (user) {
      user.oAuth = {
        id,
        provider: 'FACEBOOK',
        accessToken: access_token,
        tokenType: token_type,
      };
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }

      try {
        await user.save();
      } catch (err) {
        console.log(err);
        return res.status(500).end();
      }

      const jwtToken = jwt.sign({ userId: user._id }, secret);

      return res.status(200).json({
        data: {
          user: prepareUserResponseData(user),
          token: jwtToken,
        },
      });
    }
  }

  username = username.replace(/ /g, '_');

  if (await User.exists({ username })) {
    username += getRandomString();
  }

  user = new User({
    username,
    oAuth: {
      id,
      provider: 'FACEBOOK',
      accessToken: access_token,
      tokenType: token_type,
    },
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
    return res.status(500).end();
  }

  const secret = process.env.APP_SECRET;
  const jwtToken = jwt.sign({ userId: user._id }, secret);

  return res.status(200).json({
    data: {
      user: prepareUserResponseData(user),
      token: jwtToken,
    },
  });
};

const signInWithGoogle = async (req, res) => {
  const { error } = req.query;

  if (error) {
    console.log(error);
    return res.status(401).json({
      messages: ['Access denied.'],
    });
  }

  const { code, state } = req.query;

  try {
    jwt.verify(state, secret);
  } catch (err) {
    console.log(err);
    return res.status(403).json({
      messages: ['Cross site requests are not allowed.'],
    });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.CLIENT_ORIGIN}/signInWithGoogle`;
  const exchangeTokenUrl = `https://oauth2.googleapis.com/token?code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&grant_type=authorization_code`;

  let exchangeTokenResponse;
  try {
    exchangeTokenResponse = await axios.post(exchangeTokenUrl);
  } catch (err) {
    console.log(err?.response?.data);
    return res.status(400).json({
      errors: {
        code: ['Invalid code.'],
      },
    });
  }

  const { access_token, token_type, scope, expires_in } =
    exchangeTokenResponse.data;

  const url = 'https://www.googleapis.com/oauth2/v2/userinfo';
  let response;
  try {
    response = await axios.get(url, {
      headers: { Authorization: `${token_type} ${access_token}` },
    });
  } catch (err) {
    console.log(err?.response?.data);
    return res.status(500).end();
  }

  const { name, email, picture: avatar, id } = response.data;

  let user = User.findOne({ 'oAuth.id': id });
  if (user) {
    const jwtToken = jwt.sign({ userId: user._id }, secret);

    return res.status(200).json({
      data: {
        user: prepareUserResponseData(user),
        token: jwtToken,
      },
    });
  }

  if (email) {
    const user = User.findOne({ email });
    if (user) {
      user.oAuth = {
        id,
        provider: 'GOOGLE',
        accessToken: access_token,
        tokenType: token_type,
      };
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }

      try {
        await user.save();
      } catch (err) {
        console.log(err);
        return res.status(500).end();
      }

      const jwtToken = jwt.sign({ userId: user._id }, secret);

      return res.status(200).json({
        data: {
          user: prepareUserResponseData(user),
          token: jwtToken,
        },
      });
    }
  }

  const username = name.replace(/ /g, '_');

  if (await User.exists({ username })) {
    username += getRandomString();
  }

  user = new User({
    username,
    oAuth: {
      id,
      provider: 'GOOGLE',
      accessToken: access_token,
      tokenType: token_type,
    },
  });

  if (avatar) {
    user.avatar = avatar;
  }
  if (email) {
    user.email = email;
  }

  try {
    await user.save();
  } catch (err) {
    console.log(err);
    return res.status(500).end();
  }

  const jwtToken = jwt.sign({ userId: user._id }, secret);

  return res.status(200).json({
    data: {
      user: prepareUserResponseData(user),
      token: jwtToken,
    },
  });
};

module.exports = {
  signUpWithEmail,
  signUpWithPhoneNumber,
  signInWithGithub,
  signInWithFacebook,
  signInWithGoogle,
  signInWithToken,
  logIn,
  signInWithOAuth,
};
