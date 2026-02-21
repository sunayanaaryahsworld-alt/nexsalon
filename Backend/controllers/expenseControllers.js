import { ref, push, set, get, update, remove } from "firebase/database";
import { db } from "../config/firebase.js";


// =============================
// 1️⃣ Create Expense
// =============================
export const createExpense = async (req, res) => {
  try {
    const { salonId, ...data } = req.body;

    if (!salonId) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const expenseRef = push(ref(db, `salonandspa/expenses/${salonId}`));

    const expense = {
      id: expenseRef.key,
      salonId,
      ...data,
      createdAt: Date.now(),
    };

    await set(expenseRef, expense);

    // LOG ACTIVITY
    await logActivity({
      businessId: salonId,
      user: req.user,
      type: "Finance",
      activity: `${req.user?.role || "User"} created expense: ${data.category || "General"} - ${data.amount}`,
    });
    res.locals.skipActivityLog = true;

    res.status(201).json({
      message: "Expense created successfully",
      data: expense,
    });
  } catch (err) {
    console.error("Create Expense Error:", err);
    res.status(500).json({ message: "Failed to create expense" });
  }
};
import { logActivity } from "./activityLogController.js";


// =============================
// 2️⃣ Get All Expenses
// =============================
export const getExpenses = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const snapshot = await get(
      ref(db, `salonandspa/expenses/${salonId}`)
    );

    const data = snapshot.val() || {};
    const expenseArray = Object.keys(data).map(key => ({
      ...data[key],
      id: key
    }));
    res.status(200).json(expenseArray);
  } catch (err) {
    console.error("Fetch Expenses Error:", err);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};


// =============================
// 3️⃣ Update Expense
// =============================
export const updateExpense = async (req, res) => {
  try {
    const { salonId, expenseId } = req.params;

    console.log("UPDATE EXPENSE PARAMS:", salonId, expenseId);
    console.log("RAW UPDATE BODY:", req.body);

    if (!salonId || !expenseId) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    // ❌ NEVER allow these fields to be updated
    const {
      id,
      salonId: _ignoreSalonId,
      createdAt,
      ...safeUpdates
    } = req.body;

    console.log("SANITIZED UPDATE BODY:", safeUpdates);

    await update(
      ref(db, `salonandspa/expenses/${salonId}/${expenseId}`),
      safeUpdates
    );

    // LOG ACTIVITY
    await logActivity({
      businessId: salonId,
      user: req.user,
      type: "Finance",
      activity: `${req.user?.role || "User"} updated expense: ${safeUpdates.category || "Unknown"}`,
    });
    res.locals.skipActivityLog = true;

    res.status(200).json({
      message: "Expense updated successfully",
      expenseId,
    });

  } catch (err) {
    console.error("Update Expense Error:", err);
    res.status(500).json({ message: "Failed to update expense" });
  }
};



// =============================
// 4️⃣ Delete Expense
// =============================
export const deleteExpense = async (req, res) => {
  try {
    const { salonId, expenseId } = req.params;

    if (!salonId || !expenseId) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    await remove(
      ref(db, `salonandspa/expenses/${salonId}/${expenseId}`)
    );

    // LOG ACTIVITY
    await logActivity({
      businessId: salonId,
      user: req.user,
      type: "Finance",
      activity: `${req.user?.role || "User"} deleted an expense`,
    });
    res.locals.skipActivityLog = true;

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Delete Expense Error:", err);
    res.status(500).json({ message: "Failed to delete expense" });
  }
};
