import {
  ref,
  get,
  push,
  update,
  query,
  orderByChild,
  equalTo,
  set,
  runTransaction,
} from "firebase/database";
import { db } from "../config/firebase.js";
export const createPlan = async (req, res) => {
  try {
    const { planName, description, pricing, features } = req.body;

    const superadminId = req.user?.uid;

    if (!superadminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (
      !planName ||
      !description ||
      !Array.isArray(pricing) ||
      pricing.length === 0
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    /** 🔍 Validate pricing */
    for (const p of pricing) {
      if (
        !p.durationName ||
        !p.durationDays ||
        p.price == null ||
        p.maxBusinesses == null
      ) {
        return res.status(400).json({
          error:
            "Each pricing must include durationName, durationDays, price, maxBusinesses",
        });
      }

      if (p.addonBusinessPrice != null && isNaN(Number(p.addonBusinessPrice))) {
        return res.status(400).json({
          error: "addonBusinessPrice must be a number",
        });
      }
    }

    const plansRef = ref(db, "salonandspa/plans");
    const snapshot = await get(plansRef);

    /** ❌ Prevent duplicate plan name */
    if (snapshot.exists()) {
      const exists = Object.values(snapshot.val()).some(
        (p) =>
          p?.planName &&
          p.planName.toLowerCase() === planName.toLowerCase() &&
          p.isActive !== false,
      );

      if (exists) {
        return res.status(409).json({
          error: "Plan with this name already exists",
        });
      }
    }

    const planRef = push(plansRef);
    const planId = planRef.key;

    const planData = {
      id: planId,
      planName: planName.trim(),
      description: description.trim(),

      pricing: pricing.map((p) => ({
        durationName: p.durationName.trim(),
        durationDays: Number(p.durationDays),
        price: Number(p.price),

        maxBusinesses:
          p.maxBusinesses === "unlimited"
            ? "unlimited"
            : Number(p.maxBusinesses),

        addonBusinessPrice:
          p.addonBusinessPrice != null ? Number(p.addonBusinessPrice) : null,

        addonBusinessMax:
          p.addonBusinessMax != null ? Number(p.addonBusinessMax) : null,
      })),

      features: features || [],
      isActive: true,
      createdBy: superadminId,
      createdAt: Date.now(),
      updatedAt: null,
    };

    await set(planRef, planData);

    return res.status(201).json({
      message: "Plan created successfully",
      plan: planData,
    });
  } catch (error) {
    console.error("CREATE PLAN ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    if (!planId) {
      return res.status(400).json({ error: "planId required" });
    }

    const planRef = ref(db, `salonandspa/plans/${planId}`);
    const planSnap = await get(planRef);

    if (!planSnap.exists()) {
      return res.status(404).json({ error: "Plan not found" });
    }

    /* ---------- VALIDATIONS ---------- */

    if (updates.planName !== undefined && !updates.planName.trim()) {
      return res.status(400).json({ error: "Plan name cannot be empty" });
    }

    if (updates.description !== undefined && !updates.description.trim()) {
      return res.status(400).json({ error: "Description cannot be empty" });
    }

    // Validate pricing if provided
    if (updates.pricing) {
      if (!Array.isArray(updates.pricing) || updates.pricing.length === 0) {
        return res
          .status(400)
          .json({ error: "Pricing must be a non-empty array" });
      }

      for (const p of updates.pricing) {
        if (
          !p.durationName ||
          !p.durationDays ||
          p.price == null ||
          p.maxBusinesses == null
        ) {
          return res.status(400).json({
            error:
              "Each pricing must include durationName, durationDays, price, maxBusinesses",
          });
        }

        if (
          p.addonBusinessPrice != null &&
          isNaN(Number(p.addonBusinessPrice))
        ) {
          return res.status(400).json({
            error: "addonBusinessPrice must be a number",
          });
        }
      }

      // Normalize pricing
      updates.pricing = updates.pricing.map((p) => ({
        durationName: p.durationName.trim(),
        durationDays: Number(p.durationDays),
        price: Number(p.price),
        maxBusinesses:
          p.maxBusinesses === "unlimited"
            ? "unlimited"
            : Number(p.maxBusinesses),
        addonBusinessPrice:
          p.addonBusinessPrice != null ? Number(p.addonBusinessPrice) : null,
        addonBusinessMax:
          p.addonBusinessMax != null ? Number(p.addonBusinessMax) : null,
      }));
    }

    /* ---------- UPDATE ---------- */
    await update(planRef, {
      ...updates,
      updatedAt: Date.now(),
    });

    return res.json({
      message: "Plan updated successfully",
    });
  } catch (err) {
    console.error("UPDATE PLAN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    if (!planId) {
      return res.status(400).json({ error: "planId required" });
    }

    const planRef = ref(db, `salonandspa/plans/${planId}`);
    const planSnap = await get(planRef);

    if (!planSnap.exists()) {
      return res.status(404).json({ error: "Plan not found" });
    }

    await update(planRef, {
      isActive: false,
      deletedAt: Date.now(),
    });

    return res.json({
      message: "Plan deactivated successfully",
    });
  } catch (err) {
    console.error("DELETE PLAN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllPlans = async (req, res) => {
  try {
    const snap = await get(ref(db, "salonandspa/plans"));

    if (!snap.exists()) {
      return res.json({ plans: [] });
    }

    const plans = Object.values(snap.val())
      .filter((plan) => plan.isActive === true)
      .sort((a, b) => a.createdAt - b.createdAt);

    return res.json({ plans });
  } catch (err) {
    console.error("GET PLANS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const reactivatePlan = async (req, res) => {
  try {
    const superadminId = req.user?.uid;

    if (!superadminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { planId } = req.params;

    if (!planId) {
      return res.status(400).json({ error: "planId is required" });
    }

    const planRef = ref(db, `salonandspa/plans/${planId}`);
    const snap = await get(planRef);

    if (!snap.exists()) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const plan = snap.val();

    if (plan.isActive === true) {
      return res.status(400).json({
        error: "Plan is already active"
      });
    }

    await update(planRef, {
      isActive: true,
      reactivatedAt: Date.now(),
      reactivatedBy: superadminId,
      deletedAt: null,
      deletedBy: null,
      updatedAt: Date.now()
    });

    return res.json({
      message: "Plan reactivated successfully"
    });

  } catch (error) {
    console.error("REACTIVATE PLAN ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
};



export const getSubscriptionPlans = async (req, res) => {
  try {
    const db = getDatabase();
    const plansRef = ref(db, "salonandspa/plans");

    const snapshot = await get(plansRef);

    if (!snapshot.exists()) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No plans found",
      });
    }

    const rawPlans = snapshot.val();

    const plans = Object.values(rawPlans).filter((plan) => {
      return (
        plan.isActive === true &&
        ["Basic", "Standard", "Premium"].includes(plan.planName) &&
        Array.isArray(plan.pricing)
      );
    });

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans",
    });
  }
};