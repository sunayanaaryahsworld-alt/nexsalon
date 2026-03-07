import express from "express";
import { getAllSalons, updateSalonStatus } from "../controllers/SalonsController.js";

const router = express.Router();

/*
====================================================
GET: All salons & spas
Endpoint:
GET /api/superdashboard/salons
====================================================
*/
router.get("/salons", getAllSalons);

/*
====================================================
PATCH: Update salon subscription status
Endpoint:
PATCH /api/superdashboard/salons/:ownerId/status
====================================================
*/
router.patch("/salons/:ownerId/status", updateSalonStatus);

export default router;