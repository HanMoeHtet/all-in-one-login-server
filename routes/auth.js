const express = require('express');
const router = express.Router();
const { signUp, verifyEmail } = require('../controllers/authController');

router.post('/signUp', signUp);
router.get('/verifyEmail', verifyEmail);

module.exports = router;
