import { db } from "../config/firebase.js";
import { ref, get } from "firebase/database";

// GET STATS
export const getWhiteLabelStats = async (req, res) => {
  try {
    const adminRef = ref(db, "salonandspa/admin");
    const snapshot = await get(adminRef);

    if (!snapshot.exists()) {
      return res.json({
        whiteLabelActive: 0,
        customDomains: 0,
        themeConfigs: 0,
      });
    }

    const admins = snapshot.val();

    let whiteLabelActive = 0;
    let customDomains = 0;
    let themeConfigs = 0;

    Object.values(admins).forEach((admin) => {
      // Example logic (adjust based on your schema)
      if (admin.whiteLabel?.enabled) whiteLabelActive++;
      if (admin.whiteLabel?.customDomain) customDomains++;
      if (admin.whiteLabel?.theme) themeConfigs++;
    });

    res.json({
      whiteLabelActive,
      customDomains,
      themeConfigs,
    });
  } catch (error) {
    console.error("getWhiteLabelStats error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};