import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  deleteContact
} from "../controllers/contactControllers.js";

const router = express.Router();

router.post("/", createContact);
router.get("/", getAllContacts);
router.get("/:id", getContactById);
router.delete("/:id", deleteContact);

export default router;

