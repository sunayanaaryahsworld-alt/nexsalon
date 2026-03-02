import express from "express";
import { getWhiteLabelStats } from "../controllers/whiteLabelController.js";

const router = express.Router();

router.get("/stats", getWhiteLabelStats);

export default router;