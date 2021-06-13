const express = require('express');
const router = express.Router();
const {
  signUp,
  verifyEmail,
  sendNewEmail,
  verifyPhoneNumber,
  sendNewOTP,
  signInWithGithub,
  signInWithFacebook,
  signInWithGoogle,
} = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/signUp', signUp);
router.get('/verifyEmail', verifyEmail);
router.get('/sendNewEmail', authMiddleware, sendNewEmail);
router.post('/verifyPhoneNumber', authMiddleware, verifyPhoneNumber);
router.get('/sendNewOTP', authMiddleware, sendNewOTP);

router.get('/signInWithGithub', signInWithGithub);
router.get('/signInWithFacebook', signInWithFacebook);
router.get('/signInWithGoogle', signInWithGoogle);

module.exports = router;
