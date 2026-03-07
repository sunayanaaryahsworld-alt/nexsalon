import express from "express";
import { verifyRole, verifyToken } from "../middlerware/authMiddleware.js";
import { bookAppointment } from "../controllers/appoinmentsControllers.js";
const router = express.Router();

router.post(
"/appointment",
  verifyToken,
  verifyRole(["customer"]),
  bookAppointment
);

export default router;

