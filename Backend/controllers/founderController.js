import { db } from "../config/firebase.js";
import { ref, get } from "firebase/database";

export const getFounderMetrics = async (req, res) => {
  try {
    const rootRef = ref(db, "salonandspa");
    const snapshot = await get(rootRef);
    const data = snapshot.val() || {};

    const admins = data.admin || {};
    const activityLogs = data.activityLogs || {};

    let totalMRR = 0;
    let activeSubscriptions = 0;
    let totalAdmins = Object.keys(admins).length;

    // 1. Calculate Revenue from active subscriptions
    Object.values(admins).forEach((admin) => {
      if (admin.subscription && admin.subscription.status === "active") {
        totalMRR += admin.subscription.amount || 0;
        activeSubscriptions++;
      }
    });

    const totalARR = totalMRR * 12;
    
    // 2. Simple Churn Calculation (Admins with cancelled/expired vs total)
    const inactiveAdmins = Object.values(admins).filter(a => 
      !a.subscription || a.subscription.status !== 'active'
    ).length;
    const churnRate = ((inactiveAdmins / totalAdmins) * 100).toFixed(1);

    // 3. LTV (Lifetime Value) - Simplified: Avg Revenue per user / churn
    const avgRevenue = totalMRR / (activeSubscriptions || 1);
    const ltv = avgRevenue * 12; // Simple 1-year LTV estimate

    return res.status(200).json({
      success: true,
      data: {
        mrr: `₹${(totalMRR / 100000).toFixed(1)}L`,
        arr: `₹${(totalARR / 10000000).toFixed(1)}Cr`,
        churnRate: `${churnRate}%`,
        ltv: `₹${(ltv / 100000).toFixed(1)}L`,
        cac: "₹4,200", // Usually from marketing spend data
        activeSubscriptions,
        totalAdmins
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};