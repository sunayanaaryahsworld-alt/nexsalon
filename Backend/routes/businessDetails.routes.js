import express from "express";
import { verifyToken, verifyRole } from "../middlerware/authMiddleware.js";
import {
  getBusinessDetails,
  saveBusinessDetails
} from "../controllers/businessDetails.controller.js";

const router = express.Router();
router.get(
  "/bussiness-details/:type/:placeId",
  verifyToken,
  verifyRole(["admin"]),
  getBusinessDetails
);

router.put(
  "/bussiness-details/:type/:placeId",
  verifyToken,
  verifyRole(["admin"]),
  saveBusinessDetails
);



export default router;
