import { ref, get } from "firebase/database";
import { db } from "../config/firebase.js";

/**
 * GET /api/superdashboard/users
 * Returns all admins (platform users) with pagination
 * Query params: page (default: 1), limit (default: 7)
 */
export const getAllPlatformUsers = async (req, res) => {
  try {
    const snapshot = await get(ref(db, "salonandspa/admin"));

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "No users found" });
    }

    const data = snapshot.val();

    const allUsers = Object.entries(data).map(([uid, user]) => {
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
    
        // --- Pagination ---
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 7);
     const search = (req.query.search || "").toLowerCase();
     
    // --- Search Filtering ---
let filteredUsers = allUsers;

if (search) {
  filteredUsers = allUsers.filter((user) =>
    user.name.toLowerCase().includes(search) ||
    user.email.toLowerCase().includes(search) ||
    user.role.toLowerCase().includes(search) ||
    user.company.toLowerCase().includes(search)
  );
}

    // const totalUsers = allUsers.length;
    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    // const users = allUsers.slice(startIndex, endIndex);
    const users = filteredUsers.slice(startIndex, endIndex);
   

    return res.status(200).json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
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