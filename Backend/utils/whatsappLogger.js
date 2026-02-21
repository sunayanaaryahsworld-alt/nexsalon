import { ref, push, get, set, update } from "firebase/database";
import { db } from "../config/firebase.js";
import retryQueue from "./retryQueue.js"; // ✅ retry logic

const whatsappLogger = {
  async logIncomingMessage({ from, text, timestamp, channel }) {
    const userRef = ref(db, `salonandspa/whatsapp_users/${from}`);

    const saveTask = async () => {
      const snapshot = await get(userRef);

      // Create user if not exists
      if (!snapshot.exists()) {
        await set(userRef, {
          phone: from,
          status: "ACTIVE",
          currentStep: "NEW",
          createdAt: new Date().toISOString(),
        });
      }

      // Save message
      const messagesRef = ref(
        db,
        `salonandspa/whatsapp_users/${from}/messages`
      );

      await push(messagesRef, {
        text,
        direction: "IN",
        channel,
        timestamp: timestamp || Date.now(),
      });

      // Update last activity
      await update(userRef, {
        lastMessageAt: new Date().toISOString(),
      });

      console.log("📝 WhatsApp message saved (single collection):", from);
    };

    try {
      // ✅ Try immediately
      await saveTask();
      return true;
    } catch (error) {
      console.error("❌ WhatsApp Logger Error, retry scheduled:", error);

      // 🔁 Retry later if Firebase fails
      retryQueue.addToRetry(saveTask);

      return false;
    }
  },
};

export default whatsappLogger;
