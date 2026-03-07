import { db } from "../config/firebase.js";
import { ref, get } from "firebase/database";

// GET RECENT NOTIFICATIONS (Last 3 Days) with Pagination
export const getRecentNotifications = async (req, res) => {
  try {
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    // --- Query params ---
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    // Optional: filter by type e.g. ?type=NEW_ADMIN or ?type=NEW_APPOINTMENT
    const typeFilter = req.query.type ? String(req.query.type).toUpperCase() : null;

    let notifications = [];

    // ─── 1. Fetch Admins ────────────────────────────────────────────────────
    if (!typeFilter || typeFilter === "NEW_ADMIN") {
      const adminSnap = await get(ref(db, "salonandspa/admin"));

      if (adminSnap.exists()) {
        const admins = adminSnap.val();

        Object.entries(admins).forEach(([id, admin]) => {
          // Guard: skip non-object or missing createdAt
          if (!admin || typeof admin !== "object") return;
          if (!admin.createdAt || now - admin.createdAt > threeDays) return;

          notifications.push({
            id: `admin-${id}`,
            type: "NEW_ADMIN",
            title: "New Admin Registered",
            message: `${admin.name || "Unknown"} created an account`,
            createdAt: admin.createdAt,
          });
        });
      }
    }

    // ─── 2. Fetch Appointments ──────────────────────────────────────────────
    if (!typeFilter || typeFilter === "NEW_APPOINTMENT") {
      const appointmentSnap = await get(
        ref(db, "salonandspa/appointments/salon")
      );

      if (appointmentSnap.exists()) {
        const salons = appointmentSnap.val();

        Object.values(salons).forEach((salon) => {
          // Guard: salon must be an object (not null/string/number)
          if (!salon || typeof salon !== "object") return;

          Object.values(salon).forEach((appointment) => {
            if (!appointment || typeof appointment !== "object") return;
            if (
              !appointment.createdAt ||
              now - appointment.createdAt > threeDays
            )
              return;

            notifications.push({
              id: `appointment-${appointment.appointmentId || Math.random()}`,
              type: "NEW_APPOINTMENT",
              title: "New Appointment",
              message: `${
                appointment.customer?.name || "A customer"
              } booked an appointment`,
              createdAt: appointment.createdAt,
            });
          });
        });
      }
    }

    // ─── Sort newest first ──────────────────────────────────────────────────
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    // ─── Paginate ───────────────────────────────────────────────────────────
    const total = notifications.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * limit;
    const paginated = notifications.slice(startIndex, startIndex + limit);

    res.json({
      total,
      count: paginated.length,
      currentPage: safePage,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
      notifications: paginated,
    });
  } catch (error) {
    console.error("getRecentNotifications error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};