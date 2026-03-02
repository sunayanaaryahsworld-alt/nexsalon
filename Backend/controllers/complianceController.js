import { db } from "../config/firebase.js";
import {
  ref,
  get,
  push,
  set,
  query,
  orderByChild,
  startAt,
  limitToLast
} from "firebase/database";

// ─── HELPER: Flatten nested object ───────────────────────────────────────────
const flattenObject = (obj, prefix = "") => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = prefix ? `${prefix}_${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, newKey));
    } else {
      acc[newKey] = Array.isArray(value) ? value.join("|") : value;
    }
    return acc;
  }, {});
};

// ─── HELPER: Array of objects → CSV string ───────────────────────────────────
const toCSV = (rows) => {
  if (!rows || rows.length === 0) return "No data available\n";

  const flatRows = rows.map((row) => flattenObject(row));
  const headers = [...new Set(flatRows.flatMap((r) => Object.keys(r)))];

  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.join(",");
  const dataRows = flatRows.map((row) =>
    headers.map((h) => escape(row[h])).join(",")
  );

  return [headerRow, ...dataRows].join("\n");
};

// ─── GET AUDIT LOGS ───────────────────────────────────────────────────────────
export const getAuditLogs = async (req, res) => {
  try {
    const { businessId, days = 30, limit = 50 } = req.query;
    const cutoff = Date.now() - Number(days) * 24 * 60 * 60 * 1000;
    let allLogs = [];

    if (businessId) {
      const q = query(
        ref(db, `salonandspa/activityLogs/${businessId}`),
        orderByChild("createdAt"),
        startAt(cutoff),
        limitToLast(Number(limit))
      );
      const snapshot = await get(q);

      const data = snapshot.val() || {};
      allLogs = Object.entries(data).map(([id, log]) => ({
        id,
        ...log,
        createdAtReadable: new Date(log.createdAt).toISOString(),
      }));
    } else {
      const snapshot = await get(ref(db, "salonandspa/activityLogs"));

      const allBusinessLogs = snapshot.val() || {};

      for (const [bizId, logs] of Object.entries(allBusinessLogs)) {
        const entries = Object.entries(logs || {})
          .map(([id, log]) => ({
            id,
            businessId: bizId,
            ...log,
            createdAtReadable: new Date(log.createdAt).toISOString(),
          }))
          .filter((log) => log.createdAt >= cutoff);
        allLogs.push(...entries);
      }

      allLogs.sort((a, b) => b.createdAt - a.createdAt);
      allLogs = allLogs.slice(0, Number(limit));
    }

    return res.status(200).json({
      success: true,
      total: allLogs.length,
      data: allLogs,
    });
  } catch (error) {
    console.error("getAuditLogs error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CREATE AUDIT LOG ─────────────────────────────────────────────────────────
export const createAuditLog = async (req, res) => {
  try {
    const {
      businessId,
      activity,
      type,
      entityId,
      entityType,
      updatedByName,
      updatedByRole,
      updatedByUserId,
    } = req.body;

    if (!businessId || !activity || !type) {
      return res.status(400).json({
        success: false,
        message: "businessId, activity, and type are required",
      });
    }

    const logRef = push(ref(db, `salonandspa/activityLogs/${businessId}`));

    const logData = {
      activity,
      businessId,
      createdAt: Date.now(),
      entity: {
        entityId: entityId || "",
        entityType: entityType || "",
      },
      ipAddress: req.ip || "",
      type,
      updatedBy: {
        name: updatedByName || "",
        role: updatedByRole || "",
        userId: updatedByUserId || "",
      },
    };

    await set(logRef, logData);

    return res.status(201).json({
      success: true,
      message: "Audit log created successfully",
      id: logRef.key,
      data: logData,
    });
  } catch (error) {
    console.error("createAuditLog error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET COMPLIANCE SUMMARY ───────────────────────────────────────────────────
export const getComplianceSummary = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoff = Date.now() - Number(days) * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Audit logs count
    const logsSnap = await get(ref(db, "salonandspa/activityLogs"));
    const allLogs = logsSnap.val() || {};
    let totalLogs = 0;
    const logsByType = {};

    for (const bizLogs of Object.values(allLogs)) {
      for (const log of Object.values(bizLogs || {})) {
        if (log.createdAt >= cutoff) {
          totalLogs++;
          logsByType[log.type] = (logsByType[log.type] || 0) + 1;
        }
      }
    }

    // Subscription summary
    const adminSnap = await get(ref(db, "salonandspa/admin"));
    const admins = adminSnap.val() || {};
    let activeSubscriptions = 0;
    let expiredSubscriptions = 0;
    let trialSubscriptions = 0;

    for (const admin of Object.values(admins)) {
      const sub = admin.subscription;
      if (!sub) continue;
      if (sub.status === "trial") {
        trialSubscriptions++;
      } else if (sub.status === "active" && sub.expiresAt > now) {
        activeSubscriptions++;
      } else {
        expiredSubscriptions++;
      }
    }

    return res.status(200).json({
      success: true,
      periodDays: Number(days),
      auditLogs: {
        total: totalLogs,
        byType: logsByType,
      },
      subscriptions: {
        active: activeSubscriptions,
        trial: trialSubscriptions,
        expired: expiredSubscriptions,
        total: activeSubscriptions + trialSubscriptions + expiredSubscriptions,
      },
    });
  } catch (error) {
    console.error("getComplianceSummary error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── EXPORT COMPLIANCE DATA ───────────────────────────────────────────────────
export const exportComplianceData = async (req, res) => {
  try {
    const {
      businessId,
      days = 30,
      format = "csv",
      section = "all",
    } = req.query;

    const cutoff = Date.now() - Number(days) * 24 * 60 * 60 * 1000;

    // ── Fetch Audit Logs ──────────────────────────────────────────────────────
    let auditLogs = [];

    if (section === "logs" || section === "all") {
      if (businessId) {
        const q = query(
          ref(db, `salonandspa/activityLogs/${businessId}`),
          orderByChild("createdAt"),
          startAt(cutoff)
        );
        const snap = await get(q);

        const data = snap.val() || {};
        auditLogs = Object.entries(data).map(([id, log]) => ({
          id,
          ...log,
          createdAtReadable: new Date(log.createdAt).toISOString(),
        }));
      } else {
        const logsRef = ref(db, "salonandspa/activityLogs");
        const snapshot = await get(logsRef); // Fixed: assigned variable name
        const all = snapshot.val() || {}; // Fixed: used correct variable name 'snapshot'

        for (const [bizId, logs] of Object.entries(all)) {
          const entries = Object.entries(logs || {})
            .map(([id, log]) => ({
              id,
              businessId: bizId,
              ...log,
              createdAtReadable: new Date(log.createdAt).toISOString(),
            }))
            .filter((l) => l.createdAt >= cutoff);
          auditLogs.push(...entries);
        }
        auditLogs.sort((a, b) => b.createdAt - a.createdAt);
      }
    }

    // ── Fetch Subscriptions ───────────────────────────────────────────────────
    let subscriptions = [];

    if (section === "subscriptions" || section === "all") {
      const adminSnap = await get(ref(db, "salonandspa/admin"));
      const admins = adminSnap.val() || {};

      subscriptions = Object.entries(admins).map(([uid, admin]) => ({
        uid,
        name: admin.name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        role: admin.role || "",
        businessName: admin.businessName || admin.companyName || "",
        subscriptionStatus: admin.subscription?.status || "none",
        subscriptionPlan:
          admin.subscription?.planName || admin.subscription?.plan || "none",
        subscriptionAmount: admin.subscription?.amount ?? 0,
        expiresAt: admin.subscription?.expiresAt
          ? new Date(admin.subscription.expiresAt).toISOString()
          : "",
        paymentId: admin.subscription?.paymentId || "",
        adminCreatedAt: admin.createdAt
          ? new Date(admin.createdAt).toISOString()
          : "",
      }));
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // ── JSON Download ─────────────────────────────────────────────────────────
    if (format === "json") {
      let payload;

      if (section === "logs") {
        payload = {
          exportedAt: new Date().toISOString(),
          periodDays: Number(days),
          total: auditLogs.length,
          auditLogs,
        };
      } else if (section === "subscriptions") {
        payload = {
          exportedAt: new Date().toISOString(),
          total: subscriptions.length,
          subscriptions,
        };
      } else {
        payload = {
          exportedAt: new Date().toISOString(),
          periodDays: Number(days),
          auditLogs: { total: auditLogs.length, data: auditLogs },
          subscriptions: { total: subscriptions.length, data: subscriptions },
        };
      }

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="compliance_export_${timestamp}.json"`
      );
      return res.status(200).send(JSON.stringify(payload, null, 2));
    }

    // ── CSV Download ──────────────────────────────────────────────────────────
    if (section === "logs") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit_logs_${timestamp}.csv"`
      );
      return res.status(200).send(toCSV(auditLogs));
    }

    if (section === "subscriptions") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="subscriptions_${timestamp}.csv"`
      );
      return res.status(200).send(toCSV(subscriptions));
    }

    // section === "all" → combined CSV
    const combinedCsv = [
      `# COMPLIANCE & AUDIT EXPORT`,
      `# Generated: ${new Date().toISOString()}`,
      `# Period: Last ${days} days`,
      "",
      "## SECTION 1: AUDIT LOGS",
      toCSV(auditLogs),
      "",
      "## SECTION 2: ADMIN SUBSCRIPTIONS",
      toCSV(subscriptions),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="compliance_export_${timestamp}.csv"`
    );
    return res.status(200).send(combinedCsv);
  } catch (error) {
    console.error("exportComplianceData error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};