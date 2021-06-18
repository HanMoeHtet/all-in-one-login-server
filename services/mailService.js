const nodemailer = require('nodemailer');

// nodemailer config
const auth = {
  user: process.env.EMAIL,
  pass: process.env.EMAIL_PASSWORD,
};

const appName = process.env.APP_NAME;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth,
});

const sendMail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({
      from: auth.user,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.log(err);
    throw Error();
  }
};

const sendVerificationMail = async ({ to, verificationEndPoint, username }) => {
  const subject = 'Confirm your email';
  const text = getTextForVerificationMail(verificationEndPoint, useranme);
  const html = getHTMLForVerificationMail(verificationEndPoint, username);
  await sendMail({ to, subject, text, html });
};

const getTextForVerificationMail = (link, username = null) => {
  return `${username ? `Hello ${username}` : 'Dear user'}\r\n\n
    Thanks for signing up for ${appName}. To use your account, you'll first need to confirm your email via link below.\r\n
    Copy the following link and paste it in your preferred browser.\r\n
    ${link}\r\n\n
    Thanks,\r\n
    ${appName}\r\n`;
};

const getHTMLForVerificationMail = (link, username = null) => {
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
      <p>${username ? `Hello ${username}` : 'Dear user'}</p>
      <p>Thanks for signing up for ${appName}. To use your account, you'll first need to confirm your email via
        button below.
      </p>
      <a href="${link}"
        style="text-decoration: none; background-color: blue; color: white; padding: 10px; border-radius: 5px;">
        Confirm your email
      </a>
      <p>Thanks,</p>
      <p>${appName}</p>
    </div>
  </body>
  </html>`;
};

module.exports = {
  sendVerificationMail,
};
