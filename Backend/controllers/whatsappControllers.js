import whatsappLogger from "../utils/whatsappLogger.js";
import rateLimiter from "../utils/rateLimiter.js";

/**
 * Webhook verification
 */
export const verifyWhatsAppWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "cutpoint_verify";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp Webhook Verified");
    return res.status(200).send(challenge);
  }

  console.log("❌ WhatsApp Webhook Verification Failed");
  return res.sendStatus(403);
};

/**
 * Incoming WhatsApp messages
 */
export const handleWhatsAppMessage = async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    // No message → acknowledge WhatsApp
    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body || "";
    const timestamp = message.timestamp;

    // 🚦 RATE LIMIT CHECK (Dev-1 Day-2)
    const allowed = rateLimiter.isAllowed(from);

    if (!allowed) {
      console.warn(`🚫 Rate limit exceeded for ${from}`);
      return res.sendStatus(200); // Always ACK WhatsApp
    }

    // ✅ Save message (retry handled in logger)
    await whatsappLogger.logIncomingMessage({
      from,
      text,
      timestamp,
      channel: "WHATSAPP",
    });

    console.log("📨 WhatsApp message accepted:", { from, text });

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ WhatsApp Controller Error:", err);
    return res.sendStatus(200); // Never fail webhook
  }
};
