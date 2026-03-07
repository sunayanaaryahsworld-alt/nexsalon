import express from "express";
import { getSubscriptionDashboard } from "../controllers/superadminsubscriptionController.js";

const router = express.Router();

router.get("/superadminsubscriptions/dashboard", getSubscriptionDashboard);

export default router;