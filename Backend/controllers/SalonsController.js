import { ref, get, update } from "firebase/database";
import { db } from "../config/firebase.js";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/**
 * Normalize raw plan name → "Enterprise" | "Pro" | "Starter" | "Trial" | "None"
 */
function normalizePlan(raw = "") {
  const p = raw.toLowerCase();
  if (p.includes("enterprise"))                         return "Enterprise";
  if (p.includes("premium") || p.includes("pro"))      return "Pro";
  if (p.includes("standard") || p.includes("starter")) return "Starter";
  if (p.includes("trial"))                              return "Trial";
  return "None";
}

/**
 * Normalize raw subscription status → "Active" | "Pending" | "Suspended"
 */
function normalizeStatus(raw = "") {
  const s = (raw || "").toLowerCase();
  if (s === "active")                          return "Active";
  if (s === "suspended" || s === "cancelled")  return "Suspended";
  return "Pending"; // no sub, trial, unknown
}

/**
 * Extract city from address string e.g. "Kurla west ,Mumbai" → "Mumbai"
 */
function cityFromAddress(address = "") {
  const parts = address.split(",");
  return parts[parts.length - 1].trim() || address.trim();
}

/* ─────────────────────────────────────────
   GET /api/superdashboard/salons
   Returns paginated list of all salons + spas
   with owner, plan, status, revenue, branches
───────────────────────────────────────── */
export const getAllSalons = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber  = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));

    const rootSnap = await get(ref(db, "salonandspa"));
    if (!rootSnap.exists()) {
      return res.status(404).json({ message: "No data found" });
    }

    const data  = rootSnap.val();
    const salons = data.salons  || {};
    const spas   = data.spas    || {};
    const admins = data.admin   || {};
    // FIX: appointments live under appointments.salon
    const appts  = data.appointments?.salon || {};

    /* ── Build ownerId → admin map ── */
    const ownerMap = {};
    Object.entries(admins).forEach(([uid, admin]) => {
      ownerMap[uid] = admin;
    });

    /* ── Count total branches + active branches per owner ── */
    const branchCount       = {};
    const activeBranchCount = {};

    [...Object.values(salons), ...Object.values(spas)].forEach((place) => {
      const oid = place.ownerId || "";
      if (!oid) return;
      branchCount[oid] = (branchCount[oid] || 0) + 1;
      if ((place.status || "").toLowerCase() === "active") {
        activeBranchCount[oid] = (activeBranchCount[oid] || 0) + 1;
      }
    });

    /* ── Revenue per salon from paid appointments ── */
    const salonRevenue = {};
    Object.entries(appts).forEach(([salonId, salonAppts]) => {
      let rev = 0;
      Object.values(salonAppts).forEach((appt) => {
        if (appt.paymentStatus === "paid") rev += Number(appt.totalAmount) || 0;
      });
      salonRevenue[salonId] = rev;
    });

    /* ── Build unified salon list ── */
    const result = [];
    let idx = 1;

    const buildEntry = (id, place, type) => {
      const owner  = ownerMap[place.ownerId || ""] || {};
      const sub    = owner.subscription || {};
      // FIX: check both planName and plan fields (DB uses both)
      const plan   = normalizePlan(sub.planName || sub.plan || "");
      // FIX: check both status field on subscription
      const status = normalizeStatus(sub.status || "");
      const rev    = salonRevenue[id] || 0;

      return {
        id:             idx++,
        firebaseId:     id,
        // FIX: DB has both "name" and "branch" fields — prefer name, fall back to branch
        name:           place.name || place.branch || "Unnamed",
        owner:          owner.name || owner.businessName || owner.companyName || "Unknown",
        city:           cityFromAddress(place.address || ""),
        plan,
        branches:       branchCount[place.ownerId] || 0,
        activeBranches: activeBranchCount[place.ownerId] || 0,
        revenue:        rev,         // raw number; frontend formats it
        rating:         place.rating ? Number(place.rating) : null,
        status,
        type,
      };
    };

    Object.entries(salons).forEach(([id, s]) => result.push(buildEntry(id, s, "salon")));
    Object.entries(spas).forEach(([id, s])   => result.push(buildEntry(id, s, "spa")));

    /* ── Summary counts (over full dataset, not just current page) ── */
    const summary = {
      total:     result.length,
      active:    result.filter((s) => s.status === "Active").length,
      pending:   result.filter((s) => s.status === "Pending").length,
      suspended: result.filter((s) => s.status === "Suspended").length,
    };

    /* ── Paginate ── */
    const startIndex      = (pageNumber - 1) * limitNumber;
    const endIndex        = startIndex + limitNumber;
    const paginatedSalons = result.slice(startIndex, endIndex);

    return res.status(200).json({
      salons:     paginatedSalons,
      summary,
      total:      result.length,
      page:       pageNumber,
      totalPages: Math.ceil(result.length / limitNumber),
    });
  } catch (error) {
    console.error("SALONS LIST ERROR:", error);
    return res.status(500).json({ message: "Failed to load salons" });
  }
};

/* ─────────────────────────────────────────
   PATCH /api/superdashboard/salons/:ownerId/status
   Body: { status: "active" | "suspended" | "cancelled" }
   Updates the admin's subscription status
───────────────────────────────────────── */
export const updateSalonStatus = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { status }  = req.body;

    if (!ownerId || !status) {
      return res.status(400).json({ message: "ownerId and status are required" });
    }

    const allowed = ["active", "suspended", "cancelled"];
    if (!allowed.includes(status.toLowerCase())) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    await update(ref(db, `salonandspa/admin/${ownerId}/subscription`), {
      status:    status.toLowerCase(),
      updatedAt: Date.now(),
    });

    return res.status(200).json({ message: "Status updated successfully", ownerId, status });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};