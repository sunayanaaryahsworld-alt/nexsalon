import express from "express";
import { getFounderMetrics } from "../controllers/founderController.js";

const router = express.Router();
router.get("/metrics", getFounderMetrics);

export default router;