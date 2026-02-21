import { ref, get, update } from "firebase/database";
import { db } from "../config/firebase.js";

/**
 * GET: Customer Dashboard Data
 * Used by:
 * - Appointments
 * - Favorites
 * - Orders
 * - Profile / Settings
 */
export const getCustomerDashboardData = async (req, res) => {
  try {
    const customerId = req.user?.uid || req.query.customerId;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID required" });
    }

    /* ---------------- PROFILE ---------------- */
    const profileRef = ref(db, `salonandspa/customer/${customerId}`);
    const profileSnap = await get(profileRef);

    const profile = profileSnap.exists()
      ? {
          uid: customerId,
          name: profileSnap.val().name || "",
          email: profileSnap.val().email || "",
          phone: profileSnap.val().phone || "",
        }
      : null;

    /* ---------------- APPOINTMENTS ---------------- */
    const appointmentSnap = await get(
      ref(db, `salonandspa/customer/${customerId}/appointments`)
    );

    const upcoming = [];
    const past = [];
    const today = new Date();

    if (appointmentSnap.exists()) {
      Object.entries(appointmentSnap.val()).forEach(([id, apt]) => {
        const aptDate = new Date(apt.appointmentDate);

        const formatted = {
          id,
          businessId: apt.businessId || "",
          type: apt.type || "",
          date: apt.appointmentDate || "",
          time: apt.appointmentTime || "",
          status: apt.status || "booked",
        };

        aptDate >= today ? upcoming.push(formatted) : past.push(formatted);
      });
    }

    /* ---------------- FAVORITES ---------------- */
    // (Keep as-is or connect later)
    /* ---------------- FAVORITES ---------------- */
    const favSnap = await get(ref(db, `salonandspa/customer/${customerId}/favorites`));
    const favorites = [];

    if (favSnap.exists()) {
      const favData = favSnap.val();
      
      const favPromises = Object.entries(favData).map(async ([placeId, data]) => {
        const type = data.type || 'salon'; // Default to salon if missing
        const placePath = `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`;
        const placeSnap = await get(ref(db, placePath));
        
        if (placeSnap.exists()) {
          const place = placeSnap.val();
          return {
            id: placeId,
            name: place.name || "",
            location: place.address || "",
            rating: place.rating || 0,
            type: type,
            image: place.image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
          };
        }
        return null; // filtered out later
      });
      
      const resolved = await Promise.all(favPromises);
      favorites.push(...resolved.filter(Boolean));
    }

    /* ---------------- ORDERS ---------------- */
    const orderSnap = await get(
      ref(db, `salonandspa/customer/${customerId}/orders`)
    );

    const orders = orderSnap.exists()
      ? Object.entries(orderSnap.val()).map(([id, order]) => ({
          id,
          ...order,
        }))
      : [];

    /* ---------------- RESPONSE ---------------- */
    return res.status(200).json({
      profile,
      appointments: {
        upcoming,
        past,
      },
      favorites,
      orders,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to load dashboard data" });
  }
};

/**
 * PUT: Update Customer Profile
 * /api/dashboard/profile
 */
export const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user?.uid;
    const { name, email, phone } = req.body;

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await update(ref(db, `salonandspa/customer/${customerId}`), {
      name,
      email,
      phone,
      updatedAt: Date.now(),
    });

    return res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};
