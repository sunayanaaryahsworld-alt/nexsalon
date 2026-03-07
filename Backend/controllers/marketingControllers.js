import { db } from "../config/firebase.js";
import { ref, get } from "firebase/database";

/* =========================================================
   1️⃣ MARKETING LEAD STATS (CARDS)
   ========================================================= */

export const getMarketingLeadStats = async (req, res) => {
  try {
    const { salonId, range = "all" } = req.query;

    if (!salonId) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const snapshot = await get(
      ref(db, `salonandspa/appointments/salon/${salonId}`)
    );

    if (!snapshot.exists()) {
      return res.json({
        totalLeads: 0,
        convertedLeads: 0,
        revenueFromLeads: 0,
      });
    }

    const appointments = snapshot.val();
    const now = new Date();

    let totalLeads = 0;
    let convertedLeads = 0;
    let revenueFromLeads = 0;

    Object.values(appointments).forEach((appointment) => {
      if (!appointment) return;

      const dateStr = appointment.date;
      if (!dateStr) return;

      const [day, month, year] = dateStr.split("-").map(Number);
      const appointmentDate = new Date(year, month - 1, day);

      let include = false;

      switch (range) {
        case "today":
          include =
            appointmentDate.toDateString() === now.toDateString();
          break;

        case "week": {
          const start = new Date(now);
          start.setDate(start.getDate() - 7);
          include = appointmentDate >= start;
          break;
        }

        case "month":
          include =
            appointmentDate.getMonth() === now.getMonth() &&
            appointmentDate.getFullYear() === now.getFullYear();
          break;

        case "all":
        default:
          include = true;
      }

      if (!include) return;

      // TOTAL LEADS
      totalLeads++;

      // CONVERTED + REVENUE
      const status = appointment.status?.toLowerCase();
      if (status === "booked" || status === "confirmed") {
        convertedLeads++;

        // ✅ revenue from services[0].price (your DB structure)
        if (appointment.services && typeof appointment.services === "object") {
          const firstService = Object.values(appointment.services)[0];
          revenueFromLeads += Number(firstService?.price || 0);
        }
      }
    });

    return res.json({
      totalLeads,
      convertedLeads,
      revenueFromLeads,
    });
  } catch (error) {
    console.error("❌ Marketing Lead Stats Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   2️⃣ MARKETING LEADS (TABLE)
   ========================================================= */

export const getMarketingLeads = async (req, res) => {
  try {
    const { salonId, range = "all", status } = req.query;

    if (!salonId) {
      return res.status(400).json({ message: "salonId is required" });
    }

    if (!["converted", "lost"].includes(status)) {
      return res.status(400).json({
        message: "status must be converted or lost",
      });
    }

    const appointmentSnap = await get(
      ref(db, `salonandspa/appointments/salon/${salonId}`)
    );

    if (!appointmentSnap.exists()) return res.json([]);

    const servicesSnap = await get(
      ref(db, `salonandspa/salons/${salonId}/services`)
    );

    const salonServices = servicesSnap.exists()
      ? servicesSnap.val()
      : {};

    const appointments = appointmentSnap.val();
    const now = new Date();
    const leads = [];

    Object.entries(appointments).forEach(([appointmentId, appt]) => {
      if (!appt) return;

      const dateStr = appt.date;
      if (!dateStr) return;

      const [day, month, year] = dateStr.split("-").map(Number);
      const apptDate = new Date(year, month - 1, day);

      let include = true;

      if (range === "today") {
        include = apptDate.toDateString() === now.toDateString();
      }

      if (range === "week") {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        include = apptDate >= start;
      }

      if (range === "month") {
        include =
          apptDate.getMonth() === now.getMonth() &&
          apptDate.getFullYear() === now.getFullYear();
      }

      if (!include) return;

      const apptStatus = appt.status?.toLowerCase();

      if (
        status === "converted" &&
        !["booked", "confirmed"].includes(apptStatus)
      ) return;

      if (status === "lost" && apptStatus !== "cancelled") return;

      /* ✅ SAFE SERVICE EXTRACTION */
      let serviceId = "";
      let serviceName = "";

      if (appt.services) {
        const servicesArray = Array.isArray(appt.services)
          ? appt.services
          : Object.values(appt.services);

        serviceId = servicesArray[0]?.serviceId || "";
      }

      if (serviceId && salonServices[serviceId]) {
        serviceName = salonServices[serviceId].name;
      }

      leads.push({
        id: appointmentId,
        name: appt.customer?.name || "",
        phone: appt.customer?.phone || "",
        source: appt.mode || "",
        service: serviceName, // ✅ FINAL FIX
        status: apptStatus,
      });
    });

    return res.json(leads);
  } catch (error) {
    console.error("❌ Marketing Leads Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
