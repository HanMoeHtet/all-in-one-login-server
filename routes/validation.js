const express = require('express');
const { validateUsername,
  validateEmail,
  validatePhoneNumber } = require('../controllers/validationController');
const router = express.Router();

router.post('/validateUsername', validateUsername);
router.post('/validatePhoneNumber', validatePhoneNumber);
router.post('/validateEmail', validateEmail);

module.exports = router;