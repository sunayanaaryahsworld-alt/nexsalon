import { ref, get } from "firebase/database";
import { db } from "../config/firebase.js";

/**
 * GET /api/superdashboard/users
 * Returns all admins (platform users)
 */
export const getAllPlatformUsers = async (req, res) => {
  try {
    const snapshot = await get(ref(db, "salonandspa/admin"));

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No users found" });
    }

    const data = snapshot.val();

    const users = Object.entries(data).map(([uid, user]) => {
      return {
        id: uid,
        name: user.name || "N/A",
        email: user.email || "N/A",
        phone: user.phone || "N/A",
        role: formatRole(user.role),
        company: user.businessName || user.companyName || "N/A",
        status: normalizeStatus(user.subscription?.status),
        lastActive: formatLastActive(user.updatedAt || user.createdAt),
        initials: getInitials(user.name),
      };
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

/* ----------------- Helpers ----------------- */

function formatRole(role = "") {
  if (role === "admin") return "Salon Admin";
  if (role === "superadmin") return "Super Admin";
  return role;
}

function normalizeStatus(status = "") {
  const s = status?.toLowerCase();
  if (s === "active") return "active";
  if (s === "suspended" || s === "cancelled") return "blocked";
  if (s === "trial") return "pending";
  return "pending";
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatLastActive(timestamp) {
  if (!timestamp) return "Never";
  return "Recently"; // You can improve this later
}