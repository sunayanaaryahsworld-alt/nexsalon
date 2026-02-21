import express from "express";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseControllers.js";
import { verifyToken, verifyRole } from "../middlerware/authMiddleware.js";

const router = express.Router();

// ✅ CREATE → logged
router.post(
  "/",
  verifyToken,
  verifyRole(["admin"]),
  createExpense
);

// ✅ READ → NO AUTH (UI depends on this)
router.get("/:salonId", getExpenses);

// ✅ UPDATE → logged
router.put(
  "/:salonId/:expenseId",
  verifyToken,
  verifyRole(["admin"]),
  updateExpense
);

// ✅ DELETE → logged
router.delete(
  "/:salonId/:expenseId",
  verifyToken,
  verifyRole(["admin"]),
  deleteExpense
);

export default router;
