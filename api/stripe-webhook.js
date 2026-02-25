const sendEmail = require("./email"); // Import the email sending function

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Extract customer metadata (name, phone, etc.)
    const { name, phone } = session.metadata;
    const email = session.customer_email;

    const startDate = new Date().toLocaleDateString();
    const billingDay = new Date(session.created * 1000).toLocaleDateString();

    const emailBody = `
      <h3>Hi ${name},</h3>
      <p>We’re excited to officially welcome you to Clara Boxing Academy! 🎉</p>
      <p>Your membership is active as of ${startDate} and will renew each month on ${billingDay}.</p>
      <p>If you ever wish to cancel, please give 7 days notice before next billing:</p>
      <ul>
        <li>Email: claraboxingacademy@gmail.com</li>
        <li>Text: (312) 885-5934</li>
      </ul>
      <p>We’re here if you need anything! 💪🥊<br/>Rene & Michelle</p>
    `;

    // Send the email
    await sendEmail({
      to: email,
      subject: "Welcome to the CBA Family! 🥊",
      body: emailBody,
    });

    return res.status(200).json({ received: true });
  }

  res.status(200).json({ received: true });
};