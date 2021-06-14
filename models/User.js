const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  avatar: {
    type: String,
    required: false,
    default: null,
  },
  email: {
    type: String,
    required: false,
  },
  emailVerifiedAt: {
    type: Date,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  phoneNumberVerifiedAt: {
    type: Date,
    required: false,
  },
  oAuthAccessToken: {
    type: String,
    required: false,
  },
  oAuthTokenType: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  salt: { type: String, required: false },
  hash: { type: String, required: false },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
