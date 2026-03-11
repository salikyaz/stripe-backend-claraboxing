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

      const fullName =
        session.metadata?.member_name ||
        session.customer_details?.name ||
        "Member";

      const memberName = fullName.split(" ")[0];

      const memberEmail =
        session.metadata?.member_email ||
        session.customer_details?.email ||
        session.customer_email;

      if (!memberEmail) {
        console.error("No customer email found in completed checkout session");
        return res.status(200).json({
          received: true,
          emailSent: false,
        });
      }

      const startDate = new Date().toLocaleDateString("en-US");
      const billingDay = new Date(session.created * 1000).toLocaleDateString(
        "en-US"
      );

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111;">
          
          <p>Hi <strong>${memberName}</strong>,</p>

          <p>
            We’re excited to officially welcome you to Clara Boxing Academy! 🎉
          </p>

          <p>
            Your membership is officially active as of <strong>${startDate}</strong> and will automatically renew each month on the <strong>${billingDay}</strong>, based on your start date.
          </p>

          <p>
            If you ever wish to cancel, please provide <strong>7 days notice</strong> prior to your next billing date to ensure your membership is not processed for the upcoming charge.
          </p>

          <p>Notice may be submitted:</p>

          <ul>
            <li>By email to claraboxingacademy@gmail.com</li>
            <li>By text to (312) 885-5934</li>
          </ul>

          <p>
            If you have any questions about your membership or need support, we’re always here to help.
          </p>

          <p>
            We’re proud to be part of your training journey and look forward to your growth.
          </p>

          <p>See you in the gym 🥊</p>

          <br/>
          <br/>

          <p style="margin-top:40px;">
            <em>Founders</em><br/>
            <em>Rene & Michelle</em><br/>
            <strong>Clara Boxing Academy</strong>
          </p>

        </div>
      `;

      const text = `
Hi ${memberName},

We’re excited to officially welcome you to Clara Boxing Academy! 🎉

Your membership is officially active as of ${startDate} and will automatically renew each month on the ${billingDay}, based on your start date.

If you ever wish to cancel, please provide 7 days notice prior to your next billing date to ensure your membership is not processed for the upcoming charge.

Notice may be submitted:
- By email to claraboxingacademy@gmail.com
- By text to (312) 885-5934

If you have any questions about your membership or need support, we’re always here to help.

We’re proud to be part of your training journey and look forward to your growth.

See you in the gym 🥊


Founders
Rene & Michelle
Clara Boxing Academy
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