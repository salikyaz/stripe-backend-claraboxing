const nodemailer = require("nodemailer");
const mailgunTransport = require("nodemailer-mailgun-transport");

// Mailgun authentication details
const mailgunAuth = {
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  },
};

const transporter = nodemailer.createTransport(mailgunTransport(mailgunAuth));

async function sendEmail({ to, subject, body }) {
  try {
    const mailOptions = {
      from: process.env.MAILGUN_FROM_EMAIL, // Sender email (your business email)
      to, // Receiver email (customer's email)
      subject, // Subject line
      text: body, // Plain text version of the email
      html: `<div>${body}</div>`, // HTML version (optional)
    };

    await transporter.sendMail(mailOptions);
    console.log(`Mailgun email sent to ${to}`);
  } catch (err) {
    console.error("Mailgun error:", err);
    throw err;
  }
}

module.exports = sendEmail;