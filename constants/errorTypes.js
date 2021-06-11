const DUPLICATE_USERNAME = 'DUPLICATE_USERNAME';

const DUPLICATE_EMAIL = 'DUPLICATE_EMAIL';
const INVALID_EMAIL = 'INVALID_EMAIL';
const INVALID_EMAIL_VERIFICATION_TOKEN = 'INVALID_EMAIL_VERIFICATION_TOKEN';
const EMAIL_VERIFICATION_TOKEN_EXPIRED = 'EMAIL_VERIFICATION_TOKEN_EXPIRED';

const INVALID_PASSWORD = 'INVALID_PASSWORD';
const PASSWORDS_MISMATCH = 'PASSWORDS_MISMATCH';

const UNKNOWN_ERROR = 'UNKNOWN_ERROR'; // only for development while other error types are not yet handled

module.exports = {
  DUPLICATE_USERNAME,
  DUPLICATE_EMAIL,
  INVALID_EMAIL,
  INVALID_PASSWORD,
  PASSWORDS_MISMATCH,
  INVALID_EMAIL_VERIFICATION_TOKEN,
  UNKNOWN_ERROR,
  EMAIL_VERIFICATION_TOKEN_EXPIRED,
};
