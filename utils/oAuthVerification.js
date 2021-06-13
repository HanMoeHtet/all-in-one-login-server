const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.APP_SECRET;

const prepareOAuthVerification = async () => {
  const state = jwt.sign(Date.now().toString() + Math.random(), secret);

  let oAuthConsentUrl;

  if (oAuthProvider === oAuthTypes.GITHUB) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${appUrl}/signInWithGithub`;
    oAuthConsentUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  }

  return oAuthConsentUrl;
};

module.exports = {
  prepareOAuthVerification,
};
