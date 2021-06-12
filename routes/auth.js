const express = require('express');
const router = express.Router();
const {
  signUp,
  verifyEmail,
  sendNewEmail,
  verifyPhoneNumber,
  sendNewOTP,
} = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/signUp', signUp);
router.get('/verifyEmail', verifyEmail);
router.get('/sendNewEmail', authMiddleware, sendNewEmail);
router.post('/verifyPhoneNumber', authMiddleware, verifyPhoneNumber);
router.get('/sendNewOTP', authMiddleware, sendNewOTP);

module.exports = router;
