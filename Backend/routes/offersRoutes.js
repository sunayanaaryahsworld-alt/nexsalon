import express from "express";
import { createOffer, getOffersByPlace, deleteOffer, getAllOffers, getPendingOffers , updateOfferStatus, createProductOffer,
  getproductofferbyplace,deleteProductOffer,getAllProductOffers
} from "../controllers/offersControllers.js";
import { verifyToken, verifyRole } from "../middlerware/authMiddleware.js";
import { uploadImage } from "../middlerware/uploadSalonImage.js";

const router = express.Router();

// Public: Get all offers (for discovery) - Filtered by approved in controller
router.get("/", getAllOffers);

// Admin: Get all pending offers (MUST be before /:type/:placeId to avoid route conflict)
router.get(
  "/pending",
  verifyToken,
  verifyRole(["admin", "superadmin"]), 
  getPendingOffers
);

// Public: Get offers by place - Filtered by approved in controller for customers
router.get("/:type/:placeId", getOffersByPlace);

// Guarded: Create offer (Status: pending)
router.post(
  "/",
  verifyToken,
  verifyRole(["receptionist", "employee", "admin", "superadmin"]),
  uploadImage.single("image"),
  createOffer
);

// Admin: Update offer status
router.patch(
  "/:type/:placeId/:offerId/status",
  verifyToken,
  verifyRole(["admin", "superadmin"]),
  updateOfferStatus
);

// Guarded: Delete offer
router.delete(
  "/:type/:placeId/:offerId",
  verifyToken,
  verifyRole(["employee"]),
  deleteOffer
);

//create product offer
router.post(
  "/product",
  verifyToken,
  verifyRole(["receptionist", "employee", "admin", "superadmin"]),
  uploadImage.single("image"),
  createProductOffer
);
 
router.get("/product/:type/:placeId", getproductofferbyplace);
router.delete("/product/:type/:placeId/:offerId", verifyToken, verifyRole(["employee"]), deleteProductOffer);
router.get("/products",getAllProductOffers)
export default router;

