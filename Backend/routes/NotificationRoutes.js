import express from "express";
import { getRecentNotifications } from "../controllers/NotificationController.js"

const router = express.Router();

router.get("/notifications", getRecentNotifications);

export default router;