require("dotenv").config();
const { verifyEmailConfig, sendEmail } = require("./email");

(async () => {
  const ok = await verifyEmailConfig();

  if (!ok) {
    console.log("SMTP verification failed.");
    process.exit(1);
  }

  try {
    await sendEmail({
      to: "khanw2608@gmail.com", // replace with another inbox you can check
      subject: "SMTP external inbox test",
      body: "Testing delivery to another inbox.",
      html: "<p>Testing delivery to another inbox.</p>",
    });

    console.log("Test email sent successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to send test email:", err);
    process.exit(1);
  }
})();