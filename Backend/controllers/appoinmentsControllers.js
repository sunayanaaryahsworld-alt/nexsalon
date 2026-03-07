import { push, ref, set, get } from "firebase/database";
import { db } from "../config/firebase.js";
import { logActivity } from "./activityLogController.js";

export const bookAppointment = async (req, res) => {
  console.log("📥 [BOOK_APPOINTMENT] API HIT");

  try {
    console.log("🔐 req.user =>", req.user);

    const customerId = req.user?.uid || req.user?.id;

    if (!customerId) {
      console.error("❌ AUTH FAILED: customerId missing");
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const {
      type,
      businessId,
      employeeId,
      services,
      appointmentDate,
      appointmentTime
    } = req.body;

    console.log("📦 Request Body =>", req.body);

    if (
      !type ||
      !businessId ||
      !services ||
      !services.length ||
      !appointmentDate ||
      !appointmentTime
    ) {
      console.error("❌ VALIDATION FAILED: Missing fields");
      return res.status(400).json({ error: "Missing fields" });
    }

    // 🔍 Fetch salon / spa
    const businessPath =
      type === "salon"
        ? `salonandspa/salons/${businessId}`
        : `salonandspa/spas/${businessId}`;

    console.log("🔎 Fetching business from:", businessPath);

    const businessSnap = await get(ref(db, businessPath));

    if (!businessSnap.exists()) {
      console.error("❌ BUSINESS NOT FOUND:", businessId);
      return res.status(404).json({ error: "Business not found" });
    }

    const businessData = businessSnap.val();
    console.log("✅ Business found:", businessData.name || businessId);

    // ✅ Resolve employee
    const finalEmployeeId =
      employeeId || businessData.masterEmployeeId || null;

    if (!finalEmployeeId) {
      console.warn("⚠️ No employee assigned, proceeding without employee");
    } else {
      console.log("👨‍🔧 Assigned employee:", finalEmployeeId);
    }

    // 📌 Firebase appointment path (CRITICAL LOG)
    const appointmentPath = `salonandspa/appointments/${type}/${businessId}`;
    console.log("🧭 Writing appointment to:", appointmentPath);

    const appointmentRef = push(ref(db, appointmentPath));
    const appointmentId = appointmentRef.key;

    console.log("🆔 Generated appointmentId:", appointmentId);

    const appointmentData = {
      appointmentId,
      type,
      placeId: businessId,
      customerId,
      employeeId: finalEmployeeId,
      services,
      date: appointmentDate,
      startTime: appointmentTime,
      status: "booked",
      mode: "online",
      createdAt: Date.now()
    };

    await set(appointmentRef, appointmentData);

    console.log("✅ Appointment saved successfully");

    // 📌 Save under customer
    const customerPath = `salonandspa/customer/${customerId}/appointments/${appointmentId}`;
    console.log("👤 Saving customer reference at:", customerPath);

    await set(ref(db, customerPath), {
      appointmentId,
      type,
      placeId: businessId,
      date: appointmentDate,
      startTime: appointmentTime,
      status: "booked",
      createdAt: Date.now()
    });

    console.log("🎉 BOOK_APPOINTMENT COMPLETED SUCCESSFULLY");

    // LOG ACTIVITY
    await logActivity({
      businessId: businessId,
      user: req.user,
      type: "Appointments",
      activity: `Online appointment booked for ${type === "salon" ? "Salon" : "Spa"}`,
    });
    res.locals.skipActivityLog = true;



    return res.status(201).json({
      message: "Appointment booked successfully",
      appointmentId
    });

  } catch (err) {
    console.error("🔥 BOOK_APPOINTMENT ERROR STACK:", err);
    return res.status(500).json({ error: err.message });
  }
};
