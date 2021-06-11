const mongoose = require('mongoose');

const EmailVerificationSchema = new mongoose.Schema({
  secret: {
    type: String,
    required: true,
  },
});

const EmailVerification = mongoose.model(
  'EmailVerification',
  EmailVerificationSchema
);

module.exports = EmailVerification;
