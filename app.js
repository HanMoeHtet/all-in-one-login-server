var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { config } = require('./database/config');
const cors = require('cors');
require('dotenv').config();

var authRouter = require('./routes/auth');
const validationRouter = require('./routes/validation')

var app = express();

const clientOrigin = process.env.CLIENT_ORIGIN;

app.use(cors({ origin: clientOrigin }))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRouter);
app.use('/validation', validationRouter);

(async function () {
  await config();
})();

module.exports = app;
