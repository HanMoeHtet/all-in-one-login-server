const jwt = require('jsonwebtoken');
const oAuthTypes = require('../constants/oAuthTypes');

const secret = process.env.APP_SECRET;

const prepareOAuthVerification = async (oAuthProvider) => {
  const state = jwt.sign(Date.now().toString() + Math.random(), secret);

  let oAuthConsentUrl;

  if (oAuthProvider === oAuthTypes.GITHUB) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const appUrl = process.env.APP_URL;
    const redirectUri = `${appUrl}/signInWithGithub`;
    oAuthConsentUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  }

  return oAuthConsentUrl;
};

module.exports = {
  prepareOAuthVerification,
};
