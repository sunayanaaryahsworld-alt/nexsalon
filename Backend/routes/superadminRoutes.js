import express from "express";
import { verifyRole, verifyToken } from "../middlerware/authMiddleware.js";
import { createPlan, deletePlan, getAllPlans, reactivatePlan, updatePlan } from "../controllers/superadminControllers.js";
import { getSubscriptionPlans } from "../controllers/superadminControllers.js";

const router = express.Router()

router.post(
  "/plans",
  verifyToken,
  verifyRole(["superadmin"]),
  createPlan
);

router.put(
  "/plans/:planId",
  verifyToken,
  verifyRole(["superadmin"]),
  updatePlan
);

router.delete(
  "/plans/:planId",
  verifyToken,
  verifyRole(["superadmin"]),
  deletePlan
);

router.get("/plans", getAllPlans);

router.patch(
  "/plans/:planId/reactivate",
  verifyToken,
  verifyRole(["superadmin"]),
  reactivatePlan
);

router.get("/plans", getSubscriptionPlans);


export default router;