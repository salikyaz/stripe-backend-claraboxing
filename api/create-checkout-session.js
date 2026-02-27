// const Stripe = require("stripe");
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
//   .split(",")
//   .map((s) => s.trim())
//   .filter(Boolean);

// module.exports = async (req, res) => {
//   const origin = req.headers.origin;

//   // --- CORS (frontend on localhost/Hostinger -> backend on Vercel/local) ---
//   if (origin && allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     res.setHeader("Vary", "Origin");
//   }
//   res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");

//   // Preflight
//   if (req.method === "OPTIONS") return res.status(200).end();

//   // Only allow POST
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     // NOTE:
//     // `customer_creation` is NOT allowed in subscription mode.
//     // Stripe Checkout will still create the Customer + Subscription automatically
//     // when mode="subscription" and you use a recurring price.

//     const session = await stripe.checkout.sessions.create({
//       mode: "subscription",
//       line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],

//       // Optional (recommended): require billing address if you want
//       // billing_address_collection: "auto",

//       success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
//     });

//     return res.status(200).json({ url: session.url });
//   } catch (err) {
//     console.error("Stripe error:", err);
//     return res.status(500).json({ error: err.message });
//   }
// };




// create-checkout-session.js

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  // --- CORS ---
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { memberEmail, memberName } = req.body;

    if (!memberEmail || !memberName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Do NOT create a Customer upfront.
    // ✅ Let Stripe Checkout create the Customer during the payment flow (on successful completion),
    // especially in subscription mode unless an existing customer is provided.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],

      // ✅ Prefill email in Checkout; this will be used when Stripe creates the Customer
      customer_email: memberEmail,

      // ✅ Ask for billing address
      billing_address_collection: "required",

      // ✅ Turn on phone collection inside Stripe Checkout
      phone_number_collection: { enabled: true },

      // ✅ Keep member name/email in metadata (Customer will be created by Stripe at completion)
      metadata: {
        member_name: memberName,
        member_email: memberEmail,
      },

      subscription_data: {
        metadata: {
          member_name: memberName,
          member_email: memberEmail,
        },
      },

      success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message });
  }
};