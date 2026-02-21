import express from "express";
import { serveImage } from "../controllers/ImageController.js";

const router = express.Router();
/**
 * Example:
 * /api/image/uploads/salon/salon123.jpg
 */
router.get("/:folder/:filename", serveImage);

export default router;
