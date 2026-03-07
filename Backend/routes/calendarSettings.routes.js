import express from "express";
import {
  getCalendarSettings,
  saveCalendarSettings
} from "../controllers/calendarSettings.controller.js";

import { verifyToken, verifyRole } from "../middlerware/authMiddleware.js";

const router = express.Router();

/* ================= CALENDAR SETTINGS ================= */

// VIEW calendar settings
router.get(
  "/calendar-settings/:type/:placeId",
  verifyToken,
  verifyRole(["admin", "master_employee"]),
  getCalendarSettings
);

// UPDATE calendar settings
router.put(
  "/calendar-settings/:type/:placeId",
  verifyToken,
  verifyRole(["admin", "master_employee"]),
  saveCalendarSettings
);

export default router;
