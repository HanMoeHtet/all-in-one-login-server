const jwt = require('jsonwebtoken');
const oAuthTypes = require('../constants/oAuthTypes');

const secret = process.env.APP_SECRET;

const prepareOAuthVerification = async (oAuthProvider) => {
  const state = jwt.sign(Date.now().toString() + Math.random(), secret);

  let oAuthConsentUrl;
  const clientOrigin = process.env.CLIENT_ORIGIN;

  if (oAuthProvider === oAuthTypes.GITHUB) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${clientOrigin}/signInWithGithub`;
    oAuthConsentUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  } else if (oAuthProvider === oAuthTypes.FACEBOOK) {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${clientOrigin}/signInWithFacebook`;
    oAuthConsentUrl = `https://www.facebook.com/v11.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  } else if (oAuthProvider === oAuthTypes.GOOGLE) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${clientOrigin}/signInWithGoogle`;
    oAuthConsentUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`;
  }

  return oAuthConsentUrl;
};

module.exports = {
  prepareOAuthVerification,
};
