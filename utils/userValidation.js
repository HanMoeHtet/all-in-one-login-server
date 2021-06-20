const countryCodes = require('./countryCodes.json');
const User = require('../models/User');

const checkIfUsernameExists = async (username) => {
  if (
    await User.exists({
      username,
    })
  ) {
    return [true, ['A user with that username already exists.']];
  }

  return [false, []];
};

const checkIfEmailExists = async (email) => {
  if (
    await User.exists({
      email,
    })
  ) {
    return [true, ['A user with that email already exists.']];
  }

  return [false, []];
};

const checkIfPhoneNumberExists = async (phoneNumber) => {
  if (
    await User.exists({
      phoneNumber,
    })
  ) {
    return [true, ['A user with that phone number already exists.']];
  }

  return [false, []];
};

const MIN_USERNAME_LENGTH = 6;
const MAX_USERNAME_LENGTH = 16;

const validateUsername = (username, required = true) => {
  let isValid = true;
  const messages = [];

  if (required && username.length === 0) {
    isValid = false;
    messages.push('Username is required.');
    return [isValid, messages];
  }

  if (username.includes(' ')) {
    isValid = false;
    messages.push('Username must not contain whitespaces.');
  }

  if (
    username.length < MIN_USERNAME_LENGTH ||
    username.length > MAX_USERNAME_LENGTH
  ) {
    isValid = false;
    messages.push(
      `Username must be of length between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH}.`
    );
  }

  const regex = /[a-zA-Z_0-9]/;
  if (!regex.test(username)) {
    isValid = false;
    messages.push(
      'Username must be alphanumeric and contains only English characters.'
    );
  }

  return [isValid, messages];
};

const validateEmail = (email, required = true) => {
  let isValid = true;
  const messages = [];

  if (required && email.length === 0) {
    isValid = false;
    messages.push('Email is required.');
    return [isValid, messages];
  }

  const regex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!regex.test(email)) {
    isValid = false;
    messages.push('Email is not valid.');
  }

  return [isValid, messages];
};

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 20;

const validatePassword = (password, required = true) => {
  let isValid = true;
  const messages = [];

  if (required && password.length === 0) {
    isValid = true;
    messages.push('Password is required.');
    return [isValid, messages];
  }

  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    isValid = false;
    messages.push(
      `Password must be of length between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH}.`
    );
  }

  if (!/[a-z]{1}/.test(password)) {
    isValid = false;
    messages.push('Password must contain at least one lowercase character.');
  }

  if (!/[A-Z]{1}/.test(password)) {
    isValid = false;
    messages.push('Password must contain at least one uppercase character.');
  }

  if (!/[0-9]{1}/.test(password)) {
    isValid = false;
    messages.push('Password must contain at least one number.');
  }

  const regex = /[.!@#$%^&*()+\-={}[\]\\,./<>?|]{1}/;
  if (!regex.test(password)) {
    isValid = false;
    messages.push('Password must contain at least one special character.');
  }

  return [isValid, messages];
};

const validatePasswordConfirmation = (
  passwordConfirmation,
  password,
  required = true
) => {
  let isValid = true;
  const messages = [];

  if (required && passwordConfirmation.length === 0) {
    isValid = false;
    messages.push('Password confirmation is required.');
    return [isValid, messages];
  }

  if (passwordConfirmation !== password) {
    isValid = false;
    messages.push('Password confirmation does not match.');
  }

  return [isValid, messages];
};

const validatePhoneNumber = (phoneNumber, required = true) => {
  let isValid = true;
  const messages = [];

  if (required && phoneNumber.length === 0) {
    isValid = false;
    messages.push('Phone number is required.');
    return [isValid, messages];
  }

  return [isValid, messages];
};

const validateCountryCode = (countryCode) => {
  let isValid = true;
  const messages = [];

  if (countryCode.length === 0) {
    isValid = false;
    messages.push('Country code is required.');
    return [isValid, messages];
  }

  if (!countryCodes.find((countryCode) => countryCode.dial_code)) {
    isValid = false;
    messages.push('Invalid country code.');
  }

  return [isValid, messages];
};

const validateSignUp = async ({ username, password, passwordConfirmation }) => {
  const errors = {
    username: [],
    password: [],
    passwordConfirmation: [],
  };

  let isValid, exists, messages;

  [isValid, messages] = validateUsername(username);

  errors.username.push(...messages);

  if (isValid) {
    [exists, messages] = await checkIfUsernameExists(username);
    errors.username.push(...messages);
  }

  errors.password.push(...validatePassword(password)[1]);

  errors.passwordConfirmation.push(
    ...([isValid, messages] = validatePasswordConfirmation(
      passwordConfirmation,
      password
    )[1])
  );

  return [isValid, errors];
};

const validateEmailSignUp = async ({
  username,
  password,
  passwordConfirmation,
  email,
}) => {
  let [isValid, errors] = await validateSignUp({
    username,
    password,
    passwordConfirmation,
  });

  errors.email = [];

  [isValid, messages] = validateEmail(email);

  errors.email.push(...messages);

  if (isValid) {
    errors.email.push(...(await checkIfEmailExists(email))[1]);
  }

  return [isValid, errors];
};

const validatePhoneNumberSignUp = async ({
  useranme,
  password,
  passwordConfirmation,
  countryCode,
  phoneNumber,
}) => {
  const [isValid, errors] = validateSignUp({
    username,
    password,
    passwordConfirmation,
  });

  errors.passwordConfirmation = [];
  errors.countryCode = [];

  errors.countryCode.push(...validateCountryCode(countryCode)[1]);

  [isValid, messages] = validatePhoneNumber(phoneNumber);

  errors.phoneNumber.push(...messages);

  if (isValid) {
    errors.phoneNumber.push(
      ...(await checkIfPhoneNumberExists(phoneNumber))[1]
    );
  }

  return [isValid, errors];
};

module.exports = {
  checkIfUsernameExists,
  checkIfEmailExists,
  checkIfPhoneNumberExists,
  validateUsername,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validatePhoneNumber,
  validateCountryCode,
  validateEmailSignUp,
  validatePhoneNumberSignUp,
};
