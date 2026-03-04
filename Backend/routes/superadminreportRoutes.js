import express from "express";
import { verifyToken, verifyRole } from "../middlerware/authMiddleware.js";
import { getReports } from "../controllers/superadmin-reportController.js";

const router = express.Router();

/* ---------------- REPORT ANALYTICS ---------------- */

router.get("/", getReports);

export default router;