const mongoose = require('mongoose');

const EmailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const EmailVerification = mongoose.model(
  'EmailVerification',
  EmailVerificationSchema
);

module.exports = EmailVerification;
