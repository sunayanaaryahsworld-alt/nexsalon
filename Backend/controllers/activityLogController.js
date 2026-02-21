import { ref, push, set, get } from "firebase/database";
import { db } from "../config/firebase.js";

/**
 * CREATE ACTIVITY LOG (centralized)
 */
export const logActivity = async ({
  businessId,
  branchId = null,
  user,
  type,
  activity,
  entity = null,
  ipAddress = null,
}) => {
  try {
    if (!businessId || !user || !type || !activity) {
      console.warn("⚠️ Activity log skipped: missing required fields");
      return;
    }

    const logRef = push(
      ref(db, `salonandspa/activityLogs/${businessId}`)
    );

    const logData = {
      businessId,
      branchId,
      type,
      activity,
      entity,
      ipAddress,
      createdAt: Date.now(),
      updatedBy: {
        userId: user.id || user.uid,
        name: user.name || "Unknown",
        role: user.role || "unknown",
      },
    };

    await set(logRef, logData);

    console.log("📝 Activity log created:", type, activity);
  } catch (error) {
    // ❗ Never crash main flow because of logs
    console.error("ACTIVITY LOG ERROR:", error);
  }
};

/**
 * FETCH ACTIVITY LOGS (Log Activity page)
 */
export const getActivityLogs = async (req, res) => {
  try {
    const {
      businessId,
      branchId,
      type,
      userId,
      page = 1,
      limit = 10,
    } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: "businessId is required" });
    }

    const snapshot = await get(
      ref(db, `salonandspa/activityLogs/${businessId}`)
    );

    if (!snapshot.exists()) {
      return res.json({ data: [], pagination: {} });
    }

    let logs = Object.entries(snapshot.val()).map(([id, log]) => ({
      id,
      ...log,
    }));

    // Filters
    if (branchId) logs = logs.filter(l => l.branchId === branchId);
    if (type && type !== "All") logs = logs.filter(l => l.type === type);
    if (userId) logs = logs.filter(l => l.updatedBy?.userId === userId);

    // Latest first
    logs.sort((a, b) => b.createdAt - a.createdAt);

    // Pagination
    const start = (page - 1) * limit;
    const paginatedLogs = logs.slice(start, start + Number(limit));

    return res.json({
      data: paginatedLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: logs.length,
        totalPages: Math.ceil(logs.length / limit),
      },
    });
  } catch (err) {
    console.error("GET ACTIVITY LOGS ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch activity logs" });
  }
};



export const postTestActivityLog = async (req, res) => {
  try {
    const {
      businessId,
      branchId = null,
      user,
      type,
      activity,
      entity = null,
    } = req.body;

    if (!businessId || !user || !type || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await logActivity({
      businessId,
      branchId,
      user,
      type,
      activity,
      entity,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Activity log created (test)",
    });
  } catch (err) {
    console.error("POST TEST LOG ERROR:", err);
    return res.status(500).json({ error: "Failed to create activity log" });
  }
};
