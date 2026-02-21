import { ref, get } from "firebase/database";
import { db } from "../config/firebase.js";

/**
 * GET /api/superdashboard/dashboard
 * Super Admin Dashboard Data
 */
export const getDashboardData = async (req, res) => {
  try {
    const rootSnap = await get(ref(db, "salonandspa"));

    if (!rootSnap.exists()) {
      return res.status(404).json({ message: "No data found" });
    }

    const data = rootSnap.val();

    const admins      = data.admin      || {};
    const salons      = data.salons     || {};
    const spas        = data.spas       || {};
    const customers   = data.customer   || {};
    const apptSalons  = data.appointments?.salon || {};

    /* ── Admin / Subscription stats ── */
    let totalAdmins              = 0;
    let activeSubscriptions      = 0;
    let totalSubscriptionRevenue = 0;
    let pendingApprovals         = 0;

    // Plan breakdown for donut chart
    const planCounter = { Enterprise: 0, Pro: 0, Starter: 0, Trial: 0 };

    Object.values(admins).forEach((admin) => {
      totalAdmins++;

      const sub    = admin.subscription || {};
      const status = (sub.status || "").toLowerCase();
      const plan   = (sub.planName || sub.plan || "").toLowerCase();

      if (status === "active") {
        activeSubscriptions++;
        totalSubscriptionRevenue += sub.amount || 0;
      }

      // Map raw plan names → four display tiers
      if (plan.includes("enterprise")) planCounter.Enterprise++;
      else if (plan.includes("premium") || plan.includes("pro") || plan.includes("standard")) planCounter.Pro++;
      else if (plan.includes("starter") || plan.includes("basic")) planCounter.Starter++;
      else if (plan.includes("trial")) planCounter.Trial++;

      // Pending = admins with no subscription or status = pending
      if (!sub.status || status === "pending") pendingApprovals++;
    });

    /* ── Branch / Salon / Spa counts ── */
    const totalSalonsAndSpas = Object.keys(salons).length + Object.keys(spas).length;
    // Sum branchCount from admin records (most reliable)
    const totalBranches = Object.values(admins).reduce(
      (acc, a) => acc + (a.branchCount || 0), 0
    );

    /* ── Customer count ── */
    const totalCustomers = Object.keys(customers).length;

    /* ── Appointment / Revenue stats ── */
    let totalAppointments  = 0;
    let totalRevenue       = 0;
    let pendingAppointments = 0;

    // Per-salon revenue for top-salons ranking
    const salonRevenue = {}; // salonId → { revenue, appointments }

    Object.entries(apptSalons).forEach(([salonId, salonAppts]) => {
      salonRevenue[salonId] = salonRevenue[salonId] || { revenue: 0, appointments: 0 };

      Object.values(salonAppts).forEach((appt) => {
        totalAppointments++;
        salonRevenue[salonId].appointments++;

        if (appt.paymentStatus === "paid") {
          const amt = appt.totalAmount || 0;
          totalRevenue += amt;
          salonRevenue[salonId].revenue += amt;
        }

        if (
          appt.paymentStatus === "pending" ||
          appt.status === "confirmed"
        ) {
          pendingAppointments++;
        }
      });
    });

    /* ── Top performing salons ── */
    const topSalons = Object.entries(salonRevenue)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([salonId, stats], idx) => {
        const salonData = salons[salonId] || spas[salonId] || {};
        return {
          rank     : idx + 1,
          salonId,
          name     : salonData.businessName || salonData.name || "Unknown",
          city     : salonData.city || salonData.address || "—",
          revenue  : stats.revenue,
          appointments: stats.appointments,
        };
      });

    /* ── MRR = active subscription revenue (monthly) ── */
    const mrr = totalSubscriptionRevenue;

    /* ── Response ── */
    return res.status(200).json({
      stats: {
        totalAdmins,
        activeSubscriptions,
        totalSubscriptionRevenue,
        totalSalonsAndSpas,
        totalBranches,
        totalCustomers,
        totalAppointments,
        totalRevenue,
        pendingAppointments,
        pendingApprovals,
        mrr,
      },
      planDistribution: planCounter,
      topSalons,
    });

  } catch (error) {
    console.error("SUPERADMIN DASHBOARD ERROR:", error);
    return res.status(500).json({
      message: "Failed to load dashboard data",
    });
  }
};