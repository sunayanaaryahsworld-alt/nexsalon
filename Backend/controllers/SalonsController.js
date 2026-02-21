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
  if (p.includes("enterprise"))                        return "Enterprise";
  if (p.includes("premium") || p.includes("pro"))     return "Pro";
  if (p.includes("standard") || p.includes("starter")) return "Starter";
  if (p.includes("trial"))                             return "Trial";
  return "None";
}

/**
 * Normalize raw subscription status → "Active" | "Pending" | "Suspended"
 */
function normalizeStatus(raw = "") {
  const s = raw.toLowerCase();
  if (s === "active")                         return "Active";
  if (s === "suspended" || s === "cancelled") return "Suspended";
  return "Pending"; // no sub, trial, unknown
}

/**
 * Extract city from address string  e.g. "2nd Floor, Vashi, Mumbai" → "Mumbai"
 */
function cityFromAddress(address = "") {
  const parts = address.split(",");
  return parts[parts.length - 1].trim() || address.trim();
}

/* ─────────────────────────────────────────
   GET /api/superdashboard/salons
   Returns list of all salons + spas with
   owner, plan, status, revenue, branches
───────────────────────────────────────── */
export const getAllSalons = async (req, res) => {
  try {
    const rootSnap = await get(ref(db, "salonandspa"));
    if (!rootSnap.exists()) {
      return res.status(404).json({ message: "No data found" });
    }

    const data    = rootSnap.val();
    const salons  = data.salons  || {};
    const spas    = data.spas    || {};
    const admins  = data.admin   || {};
    const appts   = data.appointments?.salon || {};

    /* ── Build ownerId → admin map ── */
    const ownerMap = {};
    Object.entries(admins).forEach(([uid, admin]) => {
      ownerMap[uid] = admin;
    });

    /* ── Count branches per owner (salons + spas) ── */
    const branchCount = {};
    [...Object.values(salons), ...Object.values(spas)].forEach((place) => {
      const oid = place.ownerId || "";
      if (oid) branchCount[oid] = (branchCount[oid] || 0) + 1;
    });

    /* ── Revenue per salon from appointments ── */
    const salonRevenue = {};
    Object.entries(appts).forEach(([salonId, salonAppts]) => {
      let rev = 0;
      Object.values(salonAppts).forEach((appt) => {
        if (appt.paymentStatus === "paid") rev += appt.totalAmount || 0;
      });
      salonRevenue[salonId] = rev;
    });

    /* ── Build unified salon list ── */
    const result = [];
    let idx = 1;

    const buildEntry = (id, place, type) => {
      const owner  = ownerMap[place.ownerId || ""] || {};
      const sub    = owner.subscription || {};
      const plan   = normalizePlan(sub.planName || sub.plan || "");
      const status = normalizeStatus(sub.status || "");
      const rev    = salonRevenue[id] || 0;

      return {
        id:       idx++,
        firebaseId: id,
        name:     place.name || place.branch || "Unnamed",
        owner:    owner.name || owner.businessName || "Unknown",
        city:     cityFromAddress(place.address || ""),
        plan,
        branches: branchCount[place.ownerId] || 1,
        revenue:  rev,                        // raw number; frontend formats it
        rating:   place.rating ? Number(place.rating) : null,
        status,
        type,
      };
    };

    Object.entries(salons).forEach(([id, s]) => result.push(buildEntry(id, s, "salon")));
    Object.entries(spas).forEach(([id, s])   => result.push(buildEntry(id, s, "spa")));

    /* ── Summary counts ── */
    const summary = {
      total:     result.length,
      active:    result.filter((s) => s.status === "Active").length,
      pending:   result.filter((s) => s.status === "Pending").length,
      suspended: result.filter((s) => s.status === "Suspended").length,
    };

    return res.status(200).json({ salons: result, summary });
  } catch (error) {
    console.error("SALONS LIST ERROR:", error);
    return res.status(500).json({ message: "Failed to load salons" });
  }
};

/* ─────────────────────────────────────────
   PATCH /api/superdashboard/salons/:ownerId/status
   Body: { status: "active" | "suspended" }
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
      status: status.toLowerCase(),
      updatedAt: Date.now(),
    });

    return res.status(200).json({ message: "Status updated successfully", ownerId, status });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

