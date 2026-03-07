import { push, ref, set } from "firebase/database";
import { db } from "../config/firebase.js";

export const activityLoggerMiddleware = () => {
  return async (req, res, next) => {
    res.on("finish", async () => {
      try {
        // 1️⃣ Log only successful write actions
        if (![200, 201].includes(res.statusCode)) return;

        // 2️⃣ Skip read-only APIs
        if (req.method === "GET") return;

        // 3️⃣ Skip auth & activity-log APIs OR if manually skipped
        if (
          req.originalUrl.includes("/auth") ||
          req.originalUrl.includes("/activity-logs") ||
          res.locals.skipActivityLog === true
        ) {
          return;
        }

        // 4️⃣ User must exist (set by verifyToken)
        const user = req.user;
        if (!user) return;

        // 5️⃣ Resolve salonId (MOST IMPORTANT)
        const salonId =
          req.query.salonId ||
          req.body.businessId ||
          req.body.salonId ||
          req.headers["active-salon-id"] ||
          req.headers["x-salon-id"];

        if (!salonId) return;

        // 6️⃣ Create log
        const logRef = push(
          ref(db, `salonandspa/activityLogs/${salonId}`)
        );

        const logData = {
          businessId: salonId,
          branchId: null,
          createdAt: Date.now(),
          type: "System",
          activity: `${user.role} performed ${req.method} on ${req.originalUrl}`,
          ipAddress: req.ip,
          updatedBy: {
            userId: user.id || user.uid,
            name: user.name || "Unknown",
            role: user.role || "unknown",
          },
        };

        await set(logRef, logData);
      } catch (err) {
        // ❗ Never block API because of logging
        console.error("ACTIVITY LOGGER ERROR:", err);
      }
    });

    next();
  };
};
