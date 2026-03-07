import express from "express";
import { getProfile } from "../controllers/profileController.js";
import authMiddleware from "../middlerware/authMiddleware.js";
import { getReceptionistProfile, updateReceptionistProfile } from "../controllers/profileController.js";
import { updateOwnerAccount } from "../controllers/profileController.js";
import { updateSalonProfile } from "../controllers/profileController.js";

import {
  changeOwnerPassword,
  logoutOwnerFromAllDevices,
} from "../controllers/profileController.js";
import { uploadImage } from "../middlerware/uploadSalonImage.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.get(
    "/receptionist/profile/:employeeUid",
    authMiddleware,
    getReceptionistProfile
);

router.put(
    "/receptionist/profile/:employeeUid",
    authMiddleware,
    updateReceptionistProfile
);

router.put(
    "/owner",
    authMiddleware,
    uploadImage.single("ownerPhoto"),
    updateOwnerAccount
);

router.put(
    "/salon/:salonId",
    authMiddleware,
    updateSalonProfile
);

router.post(
  "/owner/change-password",
  authMiddleware,
  changeOwnerPassword
);

router.post(
  "/owner/logout-all",
  authMiddleware,
  logoutOwnerFromAllDevices
);


export default router;
