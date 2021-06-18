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
  oAuth: {
    type: {
      id: String,
      provider: String,
      accessToken: String,
      tokenType: String,
    },
    required: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  hash: { type: String, required: false },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
