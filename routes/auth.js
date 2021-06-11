const express = require('express');
const router = express.Router();
const {
  signUp,
  verifyEmail,
  sendNewEmail,
  verifyPhoneNumber,
} = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/signUp', signUp);
router.get('/verifyEmail', verifyEmail);
router.post('/sendNewEmail', authMiddleware, sendNewEmail);
router.post('/verifyPhoneNumber', authMiddleware, verifyPhoneNumber);

module.exports = router;
