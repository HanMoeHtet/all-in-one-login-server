const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.MONGODB_URL;

const config = async () => {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Mongodb connected');
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  config,
};
