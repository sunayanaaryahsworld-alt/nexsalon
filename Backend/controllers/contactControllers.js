import { ref, push, get, remove } from "firebase/database";
import { db } from "../config/firebase.js";
import { sendUserMail } from "../utils/SendUserMail.js";

/**
 * ==========================
 * CREATE CONTACT
 * ==========================
 */

export const createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: "All fields required" });
    }

    // ✅ Firebase path FIXED → contacts
    const contactsRef = ref(db, "salonandspa/contacts");

    const newContact = {
      name,
      email,
      phone,
      message,
      createdAt: Date.now()
    };

    // ✅ Save to Firebase
    await push(contactsRef, newContact);

    // ✅ Send email (NON-BLOCKING)
    try {
      await sendUserMail({
        to: email,
        name,
        message
      });
    } catch (mailErr) {
      console.error("⚠️ Email failed but data saved:", mailErr.message);
    }

    // ✅ Always return success
    return res.status(201).json({
      message: "Message sent successfully"
    });

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * ==========================
 * GET ALL CONTACTS
 * ==========================
 */
export const getAllContacts = async (req, res) => {
  try {
    const snapshot = await get(ref(db, "salonandspa/contacts"));

    if (!snapshot.exists()) {
      return res.json({ data: [] });
    }

    const data = Object.entries(snapshot.val()).map(([id, value]) => ({
      id,
      ...value
    }));

    return res.json({ data });

  } catch (err) {
    console.error("GET ALL ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * ==========================
 * GET CONTACT BY ID
 * ==========================
 */
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const snapshot = await get(ref(db, `salonandspa/contacts/${id}`));

    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({
      id,
      ...snapshot.val()
    });

  } catch (err) {
    console.error("GET BY ID ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * ==========================
 * DELETE CONTACT
 * ==========================
 */
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    await remove(ref(db, `salonandspa/contacts/${id}`));

    return res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
