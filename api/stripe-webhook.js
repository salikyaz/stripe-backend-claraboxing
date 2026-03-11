const Stripe = require("stripe");
const { buffer } = require("micro");
const { sendEmail } = require("./email");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const buf = await buffer(req);

    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Error verifying webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const memberName =
        session.metadata?.member_name ||
        session.customer_details?.name ||
        "Member";

      const memberEmail =
        session.metadata?.member_email ||
        session.customer_details?.email ||
        session.customer_email;

      const phone =
        session.customer_details?.phone || "Not provided";

      if (!memberEmail) {
        console.error("No customer email found in completed checkout session");
        return res.status(200).json({
          received: true,
          emailSent: false,
        });
      }

      const startDate = new Date().toLocaleDateString("en-US");
      const billingDay = new Date(session.created * 1000).toLocaleDateString("en-US");

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111;">
          <h2 style="margin-bottom: 12px;">Welcome to the CBA Family 🥊</h2>
          <p>Hi <strong>${memberName}</strong>,</p>
          <p>We’re excited to officially welcome you to Clara Boxing Academy.</p>
          <p>Your membership is active as of <strong>${startDate}</strong> and will renew each month based on your subscription billing cycle.</p>

          <p><strong>Signup details:</strong></p>
          <ul>
            <li>Email: ${memberEmail}</li>
            <li>Phone: ${phone}</li>
            <li>Started: ${billingDay}</li>
          </ul>

          <p>If you ever wish to cancel, please give 7 days notice before the next billing date.</p>

          <p>
            Email: claraboxingacademy@gmail.com<br/>
            Text: (312) 885-5934
          </p>

          <p>We’re here if you need anything.</p>
          <p><strong>Rene & Michelle</strong></p>
        </div>
      `;

      const text = `
Welcome to the CBA Family 🥊

Hi ${memberName},

We’re excited to officially welcome you to Clara Boxing Academy.

Your membership is active as of ${startDate} and will renew each month based on your subscription billing cycle.

Signup details:
- Email: ${memberEmail}
- Phone: ${phone}
- Started: ${billingDay}

If you ever wish to cancel, please give 7 days notice before the next billing date.

Email: claraboxingacademy@gmail.com
Text: (312) 885-5934

Rene & Michelle
      `;

      await sendEmail({
        to: memberEmail,
        subject: "Welcome to the CBA Family! 🥊",
        body: text,
        html,
      });

      console.log("Welcome email sent to:", memberEmail);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = handler;

module.exports.config = {
  api: {
    bodyParser: false,
  },
};