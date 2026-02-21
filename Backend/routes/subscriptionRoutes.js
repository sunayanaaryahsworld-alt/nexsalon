import express from "express";
import {
  getAdminSubscription,
  renewAdminSubscription,
  upgradeAdminSubscription,
  cancelAdminSubscription,
} from "../controllers/subscriptionController.js";

import {
  verifyToken,
  verifyRole,
} from "../middlerware/authMiddleware.js";

const router = express.Router();

/**
 * ADMIN SUBSCRIPTION ROUTES
 */

router.get(
  "/",
  verifyToken,
  verifyRole(["admin"]),
  getAdminSubscription
);

router.post(
  "/renew",
  verifyToken,
  verifyRole(["admin"]),
  renewAdminSubscription
);

router.post(
  "/upgrade",
  verifyToken,
  verifyRole(["admin"]),
  upgradeAdminSubscription
);

router.post(
  "/cancel",
  verifyToken,
  verifyRole(["admin"]),
  cancelAdminSubscription
);

export default router;
