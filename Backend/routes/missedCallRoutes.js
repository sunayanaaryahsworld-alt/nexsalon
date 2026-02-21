import express from "express";
import { handleMissedCall } from "../controllers/missedCallController.js";

const router = express.Router();

/**
 * Missed call webhook endpoint
 * Provider will POST here
 */
router.post("/", handleMissedCall);

export default router;
