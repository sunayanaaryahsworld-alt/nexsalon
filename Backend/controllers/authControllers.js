import { db } from "../config/firebase.js";
import bcrypt from "bcryptjs";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { ref, set, get, query, orderByChild, equalTo } from "firebase/database";
import jwt from "jsonwebtoken";

const auth = getAuth();
import { logActivity } from "../controllers/activityLogController.js";
import { generateOTP, sendOTPEmail } from "../utils/otpEmail.js";

// Allowed roles
const ALLOWED_ROLES_LOGIN = ["superadmin", "admin", "customer"];
const ALLOWED_ROLES_REGISTER = ["admin", "customer"];
/* =========================
   REGISTER
========================= */
export const register = async (req, res) => {
  const { email, password, phone, name, role } = req.body;

  if (!ALLOWED_ROLES_REGISTER.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const rolePath = `salonandspa/${role}`;

    // 1️⃣ Check phone uniqueness within role
    const usersRef = ref(db, rolePath);
    const phoneQuery = query(usersRef, orderByChild("phone"), equalTo(phone));
    const phoneSnapshot = await get(phoneQuery);

    if (phoneSnapshot.exists()) {
      return res.status(400).json({
        error: "Phone number already registered for this role",
      });
    }

    // 2️⃣ Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    // 3️⃣ OTP LOGIC (ADMIN + CUSTOMER)
    const OTP_REQUIRED_ROLES = ["admin", "customer"];

    let isVerified = true;
    let otp = null;
    let otpExpiresAt = null;

    if (OTP_REQUIRED_ROLES.includes(role)) {
      otp = generateOTP();
      otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      isVerified = false;

      await sendOTPEmail(email, otp, name);
    }

    // 4️⃣ Save to RTDB
    await set(ref(db, `${rolePath}/${uid}`), {
      uid,
      name,
      email,
      phone,
      role,
      isVerified,
      otp,
      otpExpiresAt,
      createdAt: Date.now(),
    });

    // 5️⃣ LOG ACTIVITY
    await logActivity({
      businessId: "system",
      user: { uid, name, email, role },
      type: "System",
      activity: `${role} registered: ${name} (${email})`,
    });
    res.locals.skipActivityLog = true;

    // 6️⃣ RESPONSE
    return res.status(201).json({
      message: isVerified
        ? `${role} registered successfully`
        : "OTP sent to email. Please verify.",
      uid,
      requiresOtp: !isVerified,
    });

  } catch (error) {
    console.error("🔥 Register Error:", error.message);
    return res.status(400).json({ error: error.message });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      error: "Email, password and role are required",
    });
  }

  if (!ALLOWED_ROLES_LOGIN.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    /* ---------------- FIREBASE AUTH LOGIN ---------------- */
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    /* ---------------- FETCH USER DATA FROM DB (ROLE-BASED) ---------------- */
    const userSnap = await get(ref(db, `salonandspa/${role}/${uid}`));

    if (!userSnap.exists()) {
      return res.status(401).json({
        error: `User record not found for role: ${role}`,
      });
    }

    const userData = userSnap.val();
    if (["admin", "customer"].includes(role) && userData.isVerified === false) {
  return res.status(403).json({
    error: "Email not verified",
    requiresOtp: true,
    uid,
  });
}



    /* ---------------- JWT TOKEN ---------------- */

    const token = jwt.sign(
      {
        uid,
        email: userData.email,
        role: userData.role,
        tokenVersion: userData.tokenVersion || 0,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    /* ---------------- SALON IDS ---------------- */

    const salonIds = [];
    const salonCount = userData.salonCount || 0;

    for (let i = 1; i <= salonCount; i++) {
      const salonId = userData[`salonid${i}`];
      if (salonId) salonIds.push(salonId);
    }

    /* ---------------- SPA IDS ---------------- */
    const spaIds = [];
    const spaCount = userData.spaCount || 0;
    for (let i = 1; i <= spaCount; i++) {
      const spaId = userData[`spaid${i}`];
      if (spaId) spaIds.push(spaId);
    }

    /* ---------------- RESPONSE ---------------- */

    // LOG ACTIVITY
    const logSalonId = salonIds.length > 0 ? salonIds[0] : (spaIds.length > 0 ? spaIds[0] : "system");
    await logActivity({
      businessId: logSalonId,
      user: { uid, name: userData.name, role: userData.role },
      type: "System",
      activity: `${userData.role} logged in`,
    });
    res.locals.skipActivityLog = true;

  

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        salonCount,
        salonIds,
        spaCount,
        spaIds,
        isVerified: userData.isVerified ?? false,
      },
    });
  } catch (error) {
    console.error("🔥 Login Error:", error.message);
    if (error.code && error.code.startsWith("auth/")) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }
    return res.status(500).json({
      error: "Login failed",
    });
  }
};

export const EmpLogin = async (req, res) => {
  try {
    let { phone } = req.body;

    /* ---------------- VALIDATE INPUT ---------------- */
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    // normalize phone (CRITICAL)
    const normalizedPhone = String(phone).trim();

    /* ---------------- FETCH EMPLOYEES ---------------- */
    const empSnap = await get(ref(db, "salonandspa/employees"));

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "No employees found" });
    }

    const employees = empSnap.val();

    /* ---------------- FIND EMPLOYEE ---------------- */
    const employee = Object.values(employees).find(
      (emp) =>
        String(emp.phone).trim() === normalizedPhone && emp.isActive === true,
    );

    if (!employee) {
      return res.status(401).json({
        error: "Employee not found or inactive",
      });
    }

    /* ---------------- COLLECT ASSIGNED IDS ---------------- */
    const salonIds = [];
    const spaIds = [];

    Object.entries(employee).forEach(([key, value]) => {
      if (key.startsWith("salonid") && value) salonIds.push(value);
      if (key.startsWith("spaid") && value) spaIds.push(value);
    });

    if (!salonIds.length && !spaIds.length) {
      return res.status(403).json({
        error: "Employee is not assigned to any salon or spa",
      });
    }

    /* ---------------- VERIFY MASTER ROLE ---------------- */
    let isMaster = false;
    const masterSalonIds = [];
    const masterSpaIds = [];

    // check salons
    for (const salonId of salonIds) {
      const salonSnap = await get(ref(db, `salonandspa/salons/${salonId}`));
      const salonData = salonSnap.val();
      if (
        salonSnap.exists() &&
        salonData.masterEmployeeId &&
        String(salonSnap.val().masterEmployeeId) === String(employee.empid)
      ) {
        isMaster = true;
        masterSalonIds.push(salonId);
      }
    }

    // check spas
    for (const spaId of spaIds) {
      const spaSnap = await get(ref(db, `salonandspa/spas/${spaId}`));
      const spaData = spaSnap.val();
      if (
        spaSnap.exists() &&
        spaData.masterEmployeeId &&
        String(spaSnap.val().masterEmployeeId) === String(employee.empid)
      ) {
        isMaster = true;
        masterSpaIds.push(spaId);
      }
    }

    /* ---------------- EMPLOYEE TYPE ---------------- */
    const employeeType = isMaster ? "master_employee" : "employee";

    /* ---------------- GENERATE JWT ---------------- */
    const token = jwt.sign(
      {
        uid: employee.empid,
        phone: normalizedPhone,
        employeeType, // 🔥 master_employee or employee
        role: "employee", // 🔥 real job role
        ownerId: employee.ownerId,
        salonIds: salonIds,
        spaIds: spaIds,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    /* ---------------- SUCCESS ---------------- */
    // LOG ACTIVITY
    const logPlaceId = masterSalonIds.length > 0 ? masterSalonIds[0] : (masterSpaIds.length > 0 ? masterSpaIds[0] : "unknown");
    await logActivity({
      businessId: logPlaceId,
      user: { uid: employee.empid, name: employee.name, role: employee.role },
      type: "System",
      activity: `${employee.role} (Staff) logged in`,
    });
    res.locals.skipActivityLog = true;

    return res.status(200).json({
      message: "Employee login successful",
      token,
      employee: {
        empid: employee.empid,
        name: employee.name,
        phone: normalizedPhone,
        employeeType, // 🔥 replaces role
        role: employee.role, // stylist, receptionist, etc.
        salonIds: masterSalonIds,
        spaIds: masterSpaIds,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const newRegister = async (req, res) => {
  try {
    const {
      name,
      businessName,
      address,
      email,
      phone,
      password,
      branches,
      staff,
      role,
    } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!ALLOWED_ROLES_REGISTER.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (
      !name ||
      !businessName ||
      !address ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Phone must be 10 digits" });
    }

    if (Number(branches) < 1 || Number(branches) > 100) {
      return res.status(400).json({ error: "Invalid branch count" });
    }

    if (Number(staff) < 1 || Number(staff) > 200) {
      return res.status(400).json({ error: "Invalid staff count" });
    }

    const rolePath = `salonandspa/${role}`;

    /* ---------------- PHONE UNIQUENESS ---------------- */
    const phoneQuery = query(
      ref(db, rolePath),
      orderByChild("phone"),
      equalTo(phone)
    );

    const phoneSnapshot = await get(phoneQuery);

    if (phoneSnapshot.exists()) {
      return res.status(400).json({
        error: "Phone number already registered",
      });
    }

    /* ---------------- FIREBASE AUTH CREATE ---------------- */
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    /* ---------------- HASH PASSWORD ---------------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------------- SAVE TO REALTIME DB ---------------- */
    await set(ref(db, `${rolePath}/${uid}`), {
      uid,
      name,
      businessName,
      address,
      email,
      phone,
      password: hashedPassword, // 🔐 hashed
      role,
      branchCount: Number(branches),
      staffCount: Number(staff),
      createdAt: Date.now(),
    });
    console.log("Saved at path:", `${rolePath}/${uid}`);
    /* ---------------- SUCCESS ---------------- */
    // LOG ACTIVITY
    await logActivity({
      businessId: "system",
      user: { uid, name, email, role },
      type: "System",
      activity: `New ${role} registration: ${businessName}`,
    });
    res.locals.skipActivityLog = true;

    return res.status(201).json({
      success: true,
      message: "New registration successful",
      uid,
    });

  } catch (error) {
    console.error("🔥 New Register Error:", error);

    // Handle Firebase email duplicate nicely
    if (error.code === "auth/email-already-in-use") {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    return res.status(500).json({
      error: "Server error",
    });
  }
};


/* =========================
   NEW LOGIN (ADMIN)
========================= */
export const newLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!email || !password || !role) {
      return res.status(400).json({
        error: "Email, password and role are required",
      });
    }

    if (!ALLOWED_ROLES_LOGIN.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    /* ---------- FETCH USERS ---------- */
    const roleRef = ref(db, `salonandspa/${role}`);
    const snapshot = await get(roleRef);

    if (!snapshot.exists()) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    let userData = null;
    let uid = null;

    snapshot.forEach((child) => {
      const data = child.val();
      if (data.email === email) {
        userData = data;
        uid = child.key;
      }
    });

    if (!userData || !uid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    /* ---------- PASSWORD CHECK ---------- */
    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    /* ---------- JWT ---------- */
    const token = jwt.sign(
      {
        uid,
        email: userData.email,
        role: userData.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    /* ---------- RESPONSE ---------- */
    // LOG ACTIVITY
    // Try to find a salon/spa id attached to this user for the context of the log, otherwise custom
    // Since newLogin is for admin/superadmin mostly that might have multiple branches
    await logActivity({
      businessId: "system", // Context is vague here without specific selection, logging to system/global or first branch if strictly needed. Keeping simple "system" or maybe user's first branch if available
      user: { uid, name: userData.name, role: userData.role },
      type: "System",
      activity: `${userData.role} logged in (New Login)`,
    });
    res.locals.skipActivityLog = true;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        branchCount: userData.branchCount || 0,
        staffCount: userData.staffCount || 0,
      },
    });
  } catch (error) {
    console.error("🔥 New Login Error:", error);
    return res.status(500).json({
      error: "Server error",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { uid, otp, role } = req.body;

    if (!uid || !otp || !role) {
      return res.status(400).json({ error: "UID, OTP and role required" });
    }

    if (!["admin", "customer"].includes(role)) {
      return res.status(400).json({ error: "OTP not required for this role" });
    }

    const userRef = ref(db, `salonandspa/${role}/${uid}`);
    const snap = await get(userRef);

    if (!snap.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = snap.val();

    if (user.isVerified) {
      return res.status(400).json({ error: "Already verified" });
    }

    if (user.otp !== otp || Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await set(userRef, {
      ...user,
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
    });

    return res.status(200).json({
      message: "OTP verified successfully",
    });

  } catch (error) {
    return res.status(500).json({ error: "OTP verification failed" });
  }
};
export const resendOtp = async (req, res) => {
  try {
    const { uid, role } = req.body;

    if (!uid || !role) {
      return res.status(400).json({ error: "UID and role required" });
    }

    if (!["admin", "customer"].includes(role)) {
      return res.status(400).json({ error: "OTP not supported for this role" });
    }

    const userRef = ref(db, `salonandspa/${role}/${uid}`);
    const snap = await get(userRef);

    if (!snap.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = snap.val();

    if (user.isVerified) {
      return res.status(400).json({ error: "User already verified" });
    }

    const newOtp = generateOTP();
    const newExpiry = Date.now() + 5 * 60 * 1000;

    await sendOTPEmail(user.email, newOtp, user.name);

    await set(userRef, {
      ...user,
      otp: newOtp,
      otpExpiresAt: newExpiry,
    });

    return res.status(200).json({
      message: "OTP resent successfully",
    });

  } catch (error) {
    return res.status(500).json({ error: "Failed to resend OTP" });
  }
};

