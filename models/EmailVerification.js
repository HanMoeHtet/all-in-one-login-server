const mongoose = require('mongoose');

const EmailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    unique: true,
  },
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
