import { ref, get, set, update } from "firebase/database";
import { db } from "../config/firebase.js";

export const handleMissedCall = async (req, res) => {
  try {
    const { phone, provider } = req.body;
    if (!phone) return res.sendStatus(200);

    const userRef = ref(db, `salonandspa/whatsapp_users/${phone}`);
    const snapshot = await get(userRef);

    // Create user if not exists
    if (!snapshot.exists()) {
      await set(userRef, {
        phone,
        status: "ACTIVE",
        currentStep: "NEW",
        createdAt: new Date().toISOString(),
      });
    }

    // Save consent
    await update(userRef, {
      consent: {
        approved: true,
        source: provider || "MISSED_CALL",
        approvedAt: new Date().toISOString(),
      },
    });

    console.log("📞 Consent saved in whatsapp_users:", phone);
    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ Missed call error:", error);
    return res.sendStatus(200);
  }
};
