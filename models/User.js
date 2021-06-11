const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
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
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  salt: { type: String, required: true },
  hash: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
