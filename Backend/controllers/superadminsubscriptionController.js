import { ref, get } from "firebase/database";
import { db } from "../config/firebase.js";

export const getSubscriptionDashboard = async (req, res) => {
  try {

    // Correct Firebase query
    const snapshot = await get(ref(db, "salonandspa/admin"));

    if (!snapshot.exists()) {
      return res.json({
        success: true,
        plans: [],
        revenueByPlan: [],
        expiring: []
      });
    }

    const admins = snapshot.val();

    const plans = {};
    const expiring = [];
    const now = Date.now();

    Object.entries(admins).forEach(([uid, admin]) => {

      const sub = admin.subscription;
      if (!sub) return;

      const planName = sub.planName || sub.plan || "Unknown";
      const amount = Number(sub.amount) || 0;

      // Revenue calculation
      if (!plans[planName]) {
        plans[planName] = {
          name: planName,
          salons: 0,
          revenue: 0
        };
      }

      plans[planName].salons += 1;
      plans[planName].revenue += amount;

      // Expiring soon
      if (sub.expiresAt) {
        const daysLeft = Math.ceil(
          (sub.expiresAt - now) / (1000 * 60 * 60 * 24)
        );

        if (daysLeft <= 10 && daysLeft >= 0) {
          expiring.push({
            id: uid,
            name: admin.businessName || admin.name || "Unknown",
            owner: admin.name || "Unknown",
            plan: planName,
            daysLeft
          });
        }
      }
    });

    // Chart data
    const revenueByPlan = Object.values(plans).map((p) => ({
      label: p.name,
      value: Number((p.revenue / 100000).toFixed(1)) // convert to Lakhs
    }));

    return res.json({
      success: true,
      plans: Object.values(plans),
      revenueByPlan,
      expiring
    });

  } catch (error) {
    console.error("Subscription Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load subscription dashboard"
    });
  }
};