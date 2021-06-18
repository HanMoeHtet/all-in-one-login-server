const express = require('express');
const router = express.Router();
const {
  signUp,
  signUpWithEmail,
  signUpWithPhoneNumber,
  verifyEmail,
  sendNewEmail,
  verifyPhoneNumber,
  sendNewOTP,
  signInWithGithub,
  signInWithFacebook,
  signInWithGoogle,
  signInWithToken,
  signInWithOAuth,
  logIn,
} = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/signUp', signUp);
router.post('/signUpWithEmail', signUpWithEmail);
router.post('/signUpWithPhoneNumber', signUpWithPhoneNumber);
router.post('/verifyEmail', verifyEmail);
router.get('/sendNewEmail', sendNewEmail);
router.post('/verifyPhoneNumber', verifyPhoneNumber);
router.get('/sendNewOTP', sendNewOTP);
router.post('/signInWithOAuth', signInWithOAuth);

router.post('/logIn', logIn);
router.post('/signInWithToken', signInWithToken);
router.get('/signInWithGithub', signInWithGithub);
router.get('/signInWithFacebook', signInWithFacebook);
router.get('/signInWithGoogle', signInWithGoogle);

module.exports = router;
