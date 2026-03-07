import express from "express";
import {
  getAuditLogs,
  createAuditLog,
  exportComplianceData,
  getComplianceSummary,
} from "../controllers/complianceController.js";

// import { verifyToken, isSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET  /api/compliance/logs        → fetch audit logs list
// Query: businessId?, days?, limit?
router.get("/logs", getAuditLogs);

// POST /api/compliance/logs        → create a new audit log entry
router.post("/logs", createAuditLog);

// GET  /api/compliance/summary     → counts for dashboard cards
// Query: days?
router.get("/summary", getComplianceSummary);

// GET  /api/compliance/export      → download CSV or JSON file
// Query: format=csv|json  section=all|logs|subscriptions  days?  businessId?
router.get("/export", exportComplianceData);

export default router;