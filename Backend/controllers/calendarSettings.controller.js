import { ref, get, set, update } from "firebase/database";
import { db } from "../config/firebase.js";

/* ================= GET CALENDAR SETTINGS ================= */
export const getCalendarSettings = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    if (!placeId) {
      return res.status(400).json({ error: "placeId is required" });
    }

    const basePath = type === "salon" ? "salons" : "spas";

    const settingsRef = ref(
      db,
      `salonandspa/${basePath}/${placeId}/calendarSettings`
    );

    const snap = await get(settingsRef);

    if (!snap.exists()) {
      return res.json({
        success: true,
        data: null
      });
    }

    return res.json({
      success: true,
      data: snap.val()
    });

  } catch (error) {
    console.error("GET CALENDAR SETTINGS ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch calendar settings"
    });
  }
};

/* ================= SAVE / UPDATE CALENDAR SETTINGS ================= */
export const saveCalendarSettings = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    if (!placeId) {
      return res.status(400).json({ error: "placeId is required" });
    }

    const {
      overlapTimeSlot,
      previousTimeSlot,
      weekStartFrom,
      timeSlot,
      timeFormat,
      roomNumberOption,
      staffCalendar,
      colorSettings
    } = req.body;

    const basePath = type === "salon" ? "salons" : "spas";

    const settingsRef = ref(
      db,
      `salonandspa/${basePath}/${placeId}/calendarSettings`
    );

    const payload = {
      overlapTimeSlot: !!overlapTimeSlot,
      previousTimeSlot: !!previousTimeSlot,
      weekStartFrom: weekStartFrom || "Sunday",
      timeSlot: timeSlot || "15 Mins",
      timeFormat: timeFormat || "12 Hours",
      roomNumberOption: !!roomNumberOption,
      staffCalendar: !!staffCalendar,
      colorSettings: Array.isArray(colorSettings) ? colorSettings : [],
      updatedAt: Date.now()
    };

    const snap = await get(settingsRef);

    if (snap.exists()) {
      await update(settingsRef, payload);
    } else {
      await set(settingsRef, {
        ...payload,
        createdAt: Date.now()
      });
    }

    return res.json({
      success: true,
      message: "Calendar settings saved successfully"
    });

  } catch (error) {
    console.error("SAVE CALENDAR SETTINGS ERROR:", error);
    return res.status(500).json({
      error: "Failed to save calendar settings"
    });
  }
};
