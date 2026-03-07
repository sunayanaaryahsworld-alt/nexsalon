import { ref, get, set } from "firebase/database";
import { db } from "../config/firebase.js";

/* ================= GET ================= */
export const getBusinessDetails = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    if (!type || !["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be salon or spa" });
    }

    const snapshot = await get(
      ref(db, `salonandspa/${type}s/${placeId}/businessDetails`)
    );

    return res.status(200).json({
      success: true,
      data: snapshot.exists() ? snapshot.val() : null,
    });
  } catch (error) {
    console.error("GET BUSINESS DETAILS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* ================= SAVE ================= */
export const saveBusinessDetails = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    if (!type || !["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be salon or spa" });
    }

    await set(
      ref(db, `salonandspa/${type}s/${placeId}/businessDetails`),
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Business details saved successfully",
    });
  } catch (error) {
    console.error("SAVE BUSINESS DETAILS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};
