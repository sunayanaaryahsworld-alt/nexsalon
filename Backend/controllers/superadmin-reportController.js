import { ref, get } from "firebase/database";
import { db } from "../config/firebase.js";

export const getReports = async (req, res) => {
  try {
    const snapshot = await get(ref(db, "salonandspa/appointments/salon"));

    if (!snapshot.exists()) {
      return res.status(200).json({
        peakHours: [],
        topServices: [],
        customerGrowth: [],
      });
    }

    const data = snapshot.val();

    const hourMap = {};
    const serviceMap = {};
    const growthMap = {};

    Object.values(data || {}).forEach((salon) => {
      Object.values(salon).forEach((appointment) => {

        /* -------- PEAK HOURS -------- */

        if (appointment.startTime) {
          const hour = parseInt(appointment.startTime.split(":")[0]);

          hourMap[hour] = (hourMap[hour] || 0) + 1;
        }

        /* -------- SERVICES -------- */

        if (appointment.services) {
          appointment.services.forEach((service) => {
            const name = service.serviceName || "Unknown Service";

            serviceMap[name] = (serviceMap[name] || 0) + 1;
          });
        }

        /* -------- CUSTOMER GROWTH -------- */

        if (appointment.createdAt) {
          const date = new Date(appointment.createdAt);

          const month = date.toLocaleString("default", { month: "short" });

          growthMap[month] = (growthMap[month] || 0) + 1;
        }

      });
    });

    /* ---------- FORMAT DATA ---------- */

    const peakHours = Object.entries(hourMap).map(([hour, value]) => ({
      label: `${hour % 12 || 12}${hour >= 12 ? "pm" : "am"}`,
      value,
    }));

    const topServices = Object.entries(serviceMap)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const customerGrowth = Object.entries(growthMap).map(([month, value]) => ({
      month,
      value,
    }));

    res.status(200).json({
      peakHours,
      topServices,
      customerGrowth,
    });

  } catch (error) {
    console.error("Report error:", error);

    res.status(500).json({
      message: "Failed to generate reports",
      error: error.message,
    });
  }
};