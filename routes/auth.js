const express = require('express');
const router = express.Router();
const {
  signUpWithEmail,
  signUpWithPhoneNumber,
  signInWithOAuth,
  signInWithGithub,
  signInWithFacebook,
  signInWithGoogle,
  signInWithToken,
  logIn,
} = require('../controllers/authController');
const {
  verifyEmail,
  sendNewEmail,
  verifyPhoneNumber,
  sendNewOTP,
} = require('../controllers/verificationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/signUpWithEmail', signUpWithEmail);
router.post('/signUpWithPhoneNumber', signUpWithPhoneNumber);
router.post('/signInWithOAuth', signInWithOAuth);

router.post('/verifyEmail', verifyEmail);
router.post('/sendNewEmail', sendNewEmail);
router.post('/verifyPhoneNumber', verifyPhoneNumber);
router.post('/sendNewOTP', sendNewOTP);

router.post('/logIn', logIn);
router.post('/signInWithToken', signInWithToken);
router.get('/signInWithGithub', signInWithGithub);
router.get('/signInWithFacebook', signInWithFacebook);
router.get('/signInWithGoogle', signInWithGoogle);

module.exports = router;
