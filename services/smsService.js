const Twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const appName = process.env.APP_NAME;

const client = Twilio(accountSid, authToken);

const sendSMS = async ({ to, message }) => {
  try {
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to,
    });
  } catch (err) {
    console.log(err);
    throw Error();
  }
};

const sendOTP = async ({ to, otp }) => {
  const message = getOTPMessageTemplate(otp);
  try {
    await sendSMS({ to, message });
  } catch (err) {
    throw Error();
  }
};

const getOTPMessageTemplate = (otp) => {
  return `
    Your activation code for ${appName} is: ${otp}
  `;
};

module.exports = {
  sendOTP,
};
