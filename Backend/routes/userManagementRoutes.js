import express from "express";
import { getAllPlatformUsers } from "../controllers/userManagementController.js";

const router = express.Router();

router.get("/users", getAllPlatformUsers);

export default router;