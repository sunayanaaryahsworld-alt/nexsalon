import express from "express";
import {
    createInvoice,
    getInvoices,
    deleteInvoice,
    getLoyaltyPoints
} from "../controllers/invoiceController.js";
import { verifyToken } from "../middlerware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createInvoice);
router.get("/:type/:placeId", verifyToken, getInvoices);
router.delete("/:type/:placeId/:invoiceId", verifyToken, deleteInvoice);

// Loyalty Points
router.get("/loyalty/:phone", verifyToken, getLoyaltyPoints);

export default router;
