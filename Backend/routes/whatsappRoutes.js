import express from "express";
import {
  verifyWhatsAppWebhook,
  handleWhatsAppMessage,
} from "../controllers/whatsappControllers.js";

const router = express.Router();

// Webhook verification
router.get("/", verifyWhatsAppWebhook);

// Incoming messages
router.post("/", handleWhatsAppMessage);

export default router;
