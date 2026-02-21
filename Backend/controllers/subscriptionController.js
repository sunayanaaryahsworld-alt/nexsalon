import { ref, get, update } from "firebase/database";
import { db } from "../config/firebase.js";

/**
 * GET ADMIN SUBSCRIPTION
 * GET /api/admin/subscription
 */
export const getAdminSubscription = async (req, res) => {
  try {
    const adminId = req.user.uid;

    const adminRef = ref(db, `salonandspa/admin/${adminId}`);
    const snap = await get(adminRef);

    if (!snap.exists()) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const admin = snap.val();
    const subscription = admin.subscription || null;

    return res.json({
      uid: adminId,
      subscription,
      updatedAt: admin.updatedAt || null,
    });
  } catch (err) {
    console.error("GET ADMIN SUB ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * RENEW SUBSCRIPTION
 * POST /api/admin/subscription/renew
 */
export const renewAdminSubscription = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: "paymentId is required" });
    }

    const adminRef = ref(db, `salonandspa/admin/${adminId}`);
    const snap = await get(adminRef);

    if (!snap.exists()) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const admin = snap.val();
    const sub = admin.subscription;

    if (!sub) {
      return res.status(400).json({ error: "No subscription found" });
    }

    if (!sub) {
  return res.status(400).json({ error: "No subscription found" });
}

if (sub.status === "cancelled") {
  return res
    .status(400)
    .json({ error: "Cancelled subscriptions cannot be renewed" });
}

if (!paymentId) {
  return res.status(400).json({ error: "paymentId is required" });
}

   
    const now = Date.now();
    const expiresAt =
      now + Number(sub.durationDays) * 24 * 60 * 60 * 1000;

    const updatedSubscription = {
      ...sub,
      status: "active",
      paymentId,
      expiresAt,
    };

    await update(adminRef, {
      subscription: updatedSubscription,
      updatedAt: now,
    });

    return res.json({
      message: "Subscription renewed successfully",
      subscription: updatedSubscription,
    });
  } catch (err) {
    console.error("RENEW SUB ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * UPGRADE SUBSCRIPTION
 * POST /api/admin/subscription/upgrade
 */
export const upgradeAdminSubscription = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const {
      planName,
      durationDays,
      amount,
      maxBusinesses,
      paymentId,
    } = req.body;

    if (
      !planName ||
      !durationDays ||
      !amount ||
      !maxBusinesses ||
      !paymentId
    ) {
      return res.status(400).json({ error: "Missing upgrade data" });
    }

    const now = Date.now();
    const expiresAt =
      now + Number(durationDays) * 24 * 60 * 60 * 1000;

    const newSubscription = {
      planName,
      durationDays: Number(durationDays),
      amount: Number(amount),
      remainingCount: Number(maxBusinesses),
      status: "active",
      paymentId,
      expiresAt,
    };

    const adminRef = ref(db, `salonandspa/admin/${adminId}`);

    await update(adminRef, {
      subscription: newSubscription,
      updatedAt: now,
    });

    return res.json({
      message: "Subscription upgraded successfully",
      subscription: newSubscription,
    });
  } catch (err) {
    console.error("UPGRADE SUB ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * CANCEL SUBSCRIPTION
 * POST /api/admin/subscription/cancel
 */
export const cancelAdminSubscription = async (req, res) => {
  try {
    const adminId = req.user.uid;

    const adminRef = ref(db, `salonandspa/admin/${adminId}`);
    const snap = await get(adminRef);

    if (!snap.exists()) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const admin = snap.val();
    const sub = admin.subscription;

    if (!sub) {
      return res.status(400).json({ error: "No subscription to cancel" });
    }

    const cancelledSubscription = {
      ...sub,
      amount: 0,
      expiresAt: Date.now(),
      planName: "Cancelled",
      durationDays: 0,
      paymentId: null,
      status: "cancelled",
      remainingCount: 0,
    };

    await update(adminRef, {
      subscription: cancelledSubscription,
      updatedAt: Date.now(),
    });

    return res.json({
      message: "Subscription cancelled successfully",
    });
  } catch (err) {
    console.error("CANCEL SUB ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
