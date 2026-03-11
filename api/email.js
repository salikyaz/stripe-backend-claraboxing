const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_PORT) === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log("SMTP is ready");
    return true;
  } catch (err) {
    console.error("SMTP verify failed:", err);
    return false;
  }
}

async function sendEmail({ to, subject, body, html }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: body || "",
      html:
        html ||
        `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${body || ""}</div>`,
    });

    console.log(`Email sent to ${to}`, info.messageId);
    return info;
  } catch (err) {
    console.error("SMTP email error:", err);
    throw err;
  }
}

module.exports = {
  sendEmail,
  verifyEmailConfig,
};