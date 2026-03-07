import express from "express";
import {
  getMarketingLeadStats,
  getMarketingLeads,
} from "../controllers/marketingControllers.js";

const router = express.Router();

// 🔹 Dashboard cards (Total, Converted, Revenue)
router.get("/lead-stats", getMarketingLeadStats);

// 🔹 Leads table (Converted / Lost)
router.get("/leads", getMarketingLeads);

export default router;
