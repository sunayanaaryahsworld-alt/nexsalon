import express from "express";
import {
  getCustomerDashboardData,
  updateCustomerProfile,
} from "../controllers/dashboardControllers.js";
import { verifyToken } from "../middlerware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getCustomerDashboardData);
router.put("/profile", verifyToken, updateCustomerProfile);

export default router;
