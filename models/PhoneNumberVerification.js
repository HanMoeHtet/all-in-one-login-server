const mongoose = require('mongoose');

const PhoneNumberVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    unique: true,
  },
  secret: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const PhoneNumberVerification = mongoose.model(
  'PhoneNumberVerification',
  PhoneNumberVerificationSchema
);

module.exports = PhoneNumberVerification;
