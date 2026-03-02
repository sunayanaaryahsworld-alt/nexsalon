import { db } from "../config/firebase.js";
import { ref, get } from "firebase/database";

// GET RECENT NOTIFICATIONS (Last 3 Days)
export const getRecentNotifications = async (req, res) => {
  try {
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    let notifications = [];

    // 🔹 1. Fetch Admins
    const adminRef = ref(db, "salonandspa/admin");
    const adminSnap = await get(adminRef);

    if (adminSnap.exists()) {
      const admins = adminSnap.val();

      Object.entries(admins).forEach(([id, admin]) => {
        if (
          admin.createdAt &&
          now - admin.createdAt <= threeDays
        ) {
          notifications.push({
            id: `admin-${id}`,
            type: "NEW_ADMIN",
            title: "New Admin Registered",
            message: `${admin.name} created account`,
            createdAt: admin.createdAt,
          });
        }
      });
    }

    // 🔹 2. Fetch Appointments (Customers)
    const appointmentRef = ref(db, "salonandspa/appointments/salon");
    const appointmentSnap = await get(appointmentRef);

    if (appointmentSnap.exists()) {
      const salons = appointmentSnap.val();

      Object.values(salons).forEach((salon) => {
        Object.values(salon).forEach((appointment) => {
          if (
            appointment.createdAt &&
            now - appointment.createdAt <= threeDays
          ) {
            notifications.push({
              id: `appointment-${appointment.appointmentId}`,
              type: "NEW_APPOINTMENT",
              title: "New Appointment",
              message: `${
                appointment.customer?.name || "Customer"
              } booked appointment`,
              createdAt: appointment.createdAt,
            });
          }
        });
      });
    }

    // 🔹 Sort newest first
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("getRecentNotifications error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};