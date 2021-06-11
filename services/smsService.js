const Twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = Twilio(accountSid, authToken);

const sendSMS = async ({ to, message }) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to,
    });
    console.log(response);
  } catch (err) {
    console.log(err);
  }
};

const sendOTP = async ({ to, otp }) => {
  const message = getOTPMessageTemplate(otp);
  await sendSMS({ to, message });
};

const getOTPMessageTemplate = (otp) => {
  return `
    Your activation code for %appname% is: ${otp}
  `;
};

module.exports = {
  sendOTP,
};
