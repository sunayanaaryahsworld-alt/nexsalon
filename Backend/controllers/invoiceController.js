import { ref, push, set, get, update } from "firebase/database";
import { db } from "../config/firebase.js";
import { logActivity } from "./activityLogController.js";

// CREATE INVOICE
export const createInvoice = async (req, res) => {
    try {
        const { type, placeId } = req.body;

        if (!type || !placeId) {
            return res.status(400).json({ message: "Type and Place ID required" });
        }

        // Store in salonandspa/invoices/{type}/{placeId}
        const invoiceRef = push(ref(db, `salonandspa/invoices/${type}/${placeId}`));
        const { clientId, loyaltyPointsEarned, loyaltyPointsRedeemed } = req.body;

        await set(invoiceRef, {
            ...req.body,
            isDeleted: false,
            createdAt: Date.now(),
        });

        // Update Loyalty Points: loyalty -> phone no -> points
        if (clientId) {
            const loyaltyRef = ref(db, `salonandspa/loyalty/${clientId}`);
            const loyaltySnap = await get(loyaltyRef);
            let currentPoints = 0;
            if (loyaltySnap.exists()) {
                currentPoints = loyaltySnap.val().points || 0;
            }

            const newPoints = currentPoints + (loyaltyPointsEarned || 0) - (loyaltyPointsRedeemed || 0);

            await update(loyaltyRef, {
                points: newPoints,
                lastUpdated: Date.now()
            });
        }

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Finance",
            activity: `${req.user?.role || "User"} generated invoice #${invoiceRef.key}`,
        });
        res.locals.skipActivityLog = true;

        res.status(201).json({
            message: "Invoice saved and loyalty points updated",
            invoiceId: invoiceRef.key,
        });
    } catch (err) {
        console.error("Create Invoice Error:", err);
        res.status(500).json({ message: "Failed to save invoice" });
    }
};

// GET INVOICES
export const getInvoices = async (req, res) => {
    try {
        const { type, placeId } = req.params;

        const snapshot = await get(
            ref(db, `salonandspa/invoices/${type}/${placeId}`)
        );

        if (!snapshot.exists()) {
            return res.json([]);
        }

        const data = snapshot.val();
        // Convert object to array and filter out soft-deleted ones
        const invoices = Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .filter(inv => !inv.isDeleted);

        res.json(invoices);
    } catch (err) {
        console.error("Fetch Invoice Error:", err);
        res.status(500).json({ message: "Failed to fetch invoices" });
    }
};

// SOFT DELETE INVOICE
export const deleteInvoice = async (req, res) => {
    try {
        const { type, placeId, invoiceId } = req.params;

        const invoiceRef = ref(db, `salonandspa/invoices/${type}/${placeId}/${invoiceId}`);

        await update(invoiceRef, {
            isDeleted: true,
            deletedAt: Date.now()
        });

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Finance",
            activity: `${req.user?.role || "User"} deleted invoice ${invoiceId}`,
        });
        res.locals.skipActivityLog = true;

        res.json({ message: "Invoice soft deleted successfully" });
    } catch (err) {
        console.error("Delete Invoice Error:", err);
        res.status(500).json({ message: "Failed to delete invoice" });
    }
};

// GET LOYALTY POINTS
export const getLoyaltyPoints = async (req, res) => {
    try {
        const { phone } = req.params;
        const loyaltyRef = ref(db, `salonandspa/loyalty/${phone}`);
        const snapshot = await get(loyaltyRef);

        if (!snapshot.exists()) {
            return res.json({ points: 0 });
        }

        res.json(snapshot.val());
    } catch (err) {
        console.error("Fetch Loyalty Error:", err);
        res.status(500).json({ message: "Failed to fetch loyalty points" });
    }
};
