import express from "express";
import { getOwnerReports, getStaffPerformance } from "../controllers/reportsController.js";

const router = express.Router();

// OWNER REPORTS
router.get("/owner/reports", getOwnerReports);
router.get("/owner/staff-performance", getStaffPerformance);

export default router;
