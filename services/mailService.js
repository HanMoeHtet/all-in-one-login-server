const nodemailer = require('nodemailer');
require('dotenv').config();

// nodemailer config
const auth = {
  user: process.env.EMAIL,
  pass: process.env.EMAIL_PASSWORD,
};

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth,
});

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const res = await transporter.sendMail({
      from: auth.user,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.log(err);
  }
};

const sendVerificationMail = ({ to, verificationEndPoint }) => {
  const subject = 'Confirm your email';
  const text = '';
  const html = getHTMLForVerificationMail(verificationEndPoint);
  sendMail({ to, subject, text, html });
};

const getHTMLForVerificationMail = (link) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm your email</title>
  </head>
  <body>
    <div style="font-family: sans-serif; border: 1px solid gray; padding: 15px; width: 75%; border-radius: 7px;">
      <h1 style="color: blue;">Confirm your email address</h1>
      <p>Hello %username%</p>
      <p>Thanks for signing up for %appname%. To use your account, you'll first need to confirm your email via
        button below.
      </p>
      <a href="${link}"
        style="text-decoration: none; background-color: blue; color: white; padding: 10px; border-radius: 5px;">
        Confirm your email
      </a>
      <p>If you have questions about your account, please click Help & Contact.</p>
      <p>Thanks,</p>
      <p>%appname%</p>
    </div>
  </body>
  </html>`;
};

module.exports = {
  sendVerificationMail,
};
