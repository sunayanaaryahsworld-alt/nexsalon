import express from "express";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  uploadProductImage,
  addVendor,
  updateVendor,
  deleteVendor,
  getVendors,
  addBrand,
  updateBrand,
  deleteBrand,
  getBrands
} from "../controllers/inventorycontroller.js";
import { verifyToken } from "../middlerware/authMiddleware.js"

const router = express.Router();

/* PRODUCTS */
router.get("/:type/:placeId/products", verifyToken, getProducts);
router.post(
  "/:type/:placeId/products",
  verifyToken,
  uploadProductImage.single("image"),
  addProduct
);
router.put(
  "/:type/:placeId/products/:productId",
  verifyToken,
  uploadProductImage.single("image"),
  updateProduct
);
router.delete("/:type/:placeId/products/:productId", verifyToken, deleteProduct);

/* CATEGORIES */
router.get("/:type/:placeId/categories", verifyToken, getCategories);
router.post("/:type/:placeId/categories", verifyToken, addCategory);
router.put("/:type/:placeId/categories/:categoryId", verifyToken, updateCategory);
router.delete("/:type/:placeId/categories/:categoryId", verifyToken, deleteCategory);

/* vendors */
router.post("/:type/:placeId/vendors", verifyToken, addVendor);
router.put("/:type/:placeId/vendors/:vendorId", verifyToken, updateVendor);
router.delete("/:type/:placeId/vendors/:vendorId", verifyToken, deleteVendor);
router.get("/:type/:placeId/vendors", verifyToken, getVendors);

/*brands*/
router.post("/:type/:placeId/brands", verifyToken, addBrand);
router.put("/:type/:placeId/brands/:brandId", verifyToken, updateBrand);
router.delete("/:type/:placeId/brands/:brandId", verifyToken, deleteBrand);
router.get("/:type/:placeId/brands", verifyToken, getBrands);
export default router;
