import { ref, get, push, set, update, remove } from "firebase/database";
import { db, storage } from "../config/firebase.js";
import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import multer from "multer";

/* ================= MULTER ================= */
export const uploadProductImage = multer({
    storage: multer.memoryStorage(),
});
import { logActivity } from "./activityLogController.js";

/* ================= AUTH ================= */

const authorizeInventoryAccess = (req, res) => {
    const { employeeType, role } = req.user;
    if (employeeType !== "master_employee" && role !== "admin") {
        res.status(403).json({ error: "Access denied" });
        return false;
    }
    return true;
};

/* ================= PATHS ================= */

const inventoryBasePath = (type, placeId) =>
    `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/inventory`;

const productsPath = (type, placeId) =>
    `${inventoryBasePath(type, placeId)}/products`;

const categoriesPath = (type, placeId) =>
    `${inventoryBasePath(type, placeId)}/categories`;

const vendorsPath = (type, placeId) =>
    `${inventoryBasePath(type, placeId)}/vendors`;

const brandsPath = (type, placeId) =>
    `${inventoryBasePath(type, placeId)}/brands`;

/*Validators*/
/* ================= VALIDATORS ================= */

const normalizePhone = (p) =>
    p?.replace(/\D/g, "").slice(-10);

const isValidIndianPhone = (phone) =>
    /^[6-9]\d{9}$/.test(phone);
// starts with 6,7,8,9 and 10 digits

const normalizeEmail = (e) =>
    e?.trim().toLowerCase();

const isValidEmail = (email) =>
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);

const normalizeBrandName = (name) =>
    name
        ?.toLowerCase()
        .replace(/\s+/g, "")     // remove ALL spaces
        .replace(/[^a-z0-9]/g, "") // remove special chars
        .trim();

/* ======================================================
   ===================== PRODUCTS =======================
   ====================================================== */
/* GET */
export const getProducts = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;
        const { type, placeId } = req.params;
        const snap = await get(ref(db, productsPath(type, placeId)));
        res.json(snap.exists() ? snap.val() : {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

/* ADD */
/* ADD PRODUCT */
export const addProduct = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId } = req.params;
        // Updated to match your Frontend field names
        const { name, barcodeId, brandId, categoryId, vendorId, costprice, sellprice, currentStock, minLevel, expiryDate } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Product name is required" });
        }
        const now = Date.now();
        const productRef = push(ref(db, productsPath(type, placeId)));
        const productId = productRef.key;

        let imageURL = "";
        let imagePath = "";

        // Image is now OPTIONAL
        if (req.file) {
            const ext = req.file.originalname.split(".").pop();
            imagePath = `salonandspa/products/${placeId}/${productId}-${now}.${ext}`;
            const imgRef = storageRef(storage, imagePath);
            await uploadBytes(imgRef, req.file.buffer, { contentType: req.file.mimetype });
            imageURL = await getDownloadURL(imgRef);
        }

        const data = {
            name,
            barcodeId: barcodeId || "-",
            brandId: brandId || "unbranded",
            vendorId: vendorId || "unknown",
            costprice: Number(costprice || 0),
            sellprice: Number(sellprice || 0),
            categoryId: categoryId || "uncategorized",
            currentStock: Number(currentStock || 0), // Match frontend
            minLevel: Number(minLevel || 0),        // Match frontend
            expiryDate: expiryDate || "N/A",
            image: imageURL,
            imagePath,
            createdAt: now,
            updatedAt: now,
        };

        await set(productRef, data);

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Inventory",
            activity: `Product added: ${name}`,
        });
        res.locals.skipActivityLog = true;

        res.status(201).json({ id: productId, ...data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
/* UPDATE */
export const updateProduct = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId, productId } = req.params;
        const productRef = ref(db, `${productsPath(type, placeId)}/${productId}`);

        const snap = await get(productRef);
        if (!snap.exists()) {
            return res.status(404).json({ error: "Product not found" });
        }

        const existing = snap.val();
        // CHANGED: renamed 'stock' to 'currentStock' and added 'minLevel'
        const { name, barcodeId, categoryId, brandId, vendorId, costprice, sellprice, currentStock, minLevel, expiryDate } = req.body;

        const updates = {};

        /* 🔁 Image Update Logic */
        if (req.file) {
            if (existing.imagePath) {
                try {
                    await deleteObject(storageRef(storage, existing.imagePath));
                } catch (e) {
                    console.warn("Old image delete failed:", e.message);
                }
            }

            const ext = req.file.originalname.split(".").pop();
            const newPath = `salonandspa/products/${placeId}/${productId}-${Date.now()}.${ext}`;
            const imgRef = storageRef(storage, newPath);

            await uploadBytes(imgRef, req.file.buffer, { contentType: req.file.mimetype });
            updates.image = await getDownloadURL(imgRef);
            updates.imagePath = newPath;
        }

        /* Apply Field Updates */
        if (name !== undefined) updates.name = name;
        if (barcodeId !== undefined) updates.barcodeId = barcodeId;
        if (brandId !== undefined) updates.brandId = brandId;
        if (vendorId !== undefined) updates.vendorId = vendorId;
        if (categoryId !== undefined) updates.categoryId = categoryId;
        if (costprice !== undefined) updates.costprice = Number(costprice);
        if (sellprice !== undefined) updates.sellprice = Number(sellprice);
        if (currentStock !== undefined) updates.currentStock = Number(currentStock); // Fixed
        if (minLevel !== undefined) updates.minLevel = Number(minLevel); // Added
        if (expiryDate !== undefined) updates.expiryDate = expiryDate;

        updates.updatedAt = Date.now();

        await update(productRef, updates);

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Inventory",
            activity: `Product updated: ${existing.name}`,
        });
        res.locals.skipActivityLog = true;

        res.json({
            message: "Product updated successfully",
            updatedFields: updates,
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
/* DELETE */
export const deleteProduct = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId, productId } = req.params;
        const productRef = ref(db, `${productsPath(type, placeId)}/${productId}`);

        const snap = await get(productRef);

        if (snap.exists()) {
            const { imagePath } = snap.val();
            if (imagePath) {
                try {
                    await deleteObject(storageRef(storage, imagePath));
                } catch (e) {
                    console.warn("Image delete failed:", e.message);
                }
            }
        }

        await remove(productRef);

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Inventory",
            activity: `Product deleted`,
        });
        res.locals.skipActivityLog = true;

        res.json({ message: "Product deleted successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

/* ======================================================
   ==================== CATEGORIES ======================
   ====================================================== */

export const getCategories = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;
        const { type, placeId } = req.params;
        const snap = await get(ref(db, categoriesPath(type, placeId)));
        res.json(snap.exists() ? snap.val() : {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const addCategory = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;
        const { type, placeId } = req.params;
        const { name } = req.body;

        const now = Date.now();
        const catRef = push(ref(db, categoriesPath(type, placeId)));

        await set(catRef, {
            name,
            createdAt: now,
            updatedAt: now,
        });

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Inventory",
            activity: `New category: ${name}`,
        });
        res.locals.skipActivityLog = true;

        res.status(201).json({ id: catRef.key, name });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;
        const { type, placeId, categoryId } = req.params;

        await update(ref(db, `${categoriesPath(type, placeId)}/${categoryId}`), {
            name: req.body.name,
            updatedAt: Date.now(),
        });

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Inventory",
            activity: `Category updated`,
        });
        res.locals.skipActivityLog = true;

        res.json({ message: "Category updated" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;
        const { type, placeId, categoryId } = req.params;

        await remove(ref(db, `${categoriesPath(type, placeId)}/${categoryId}`));

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Inventory",
            activity: `Category deleted`,
        });
        res.locals.skipActivityLog = true;

        res.json({ message: "Category deleted" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

/* ==========================vendors============================*/

export const getVendors = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId } = req.params;
        const snap = await get(ref(db, vendorsPath(type, placeId)));

        if (!snap.exists()) {
            return res.json({ error: "No vendors found" });
        }

        res.json(snap.exists() ? snap.val() : {}); // ✅ return object


    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const addVendor = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId } = req.params;

        let {
            name,
            contact,
            email,
            address,
            gst,
            state
        } = req.body;

        const cleanPhone = normalizePhone(contact);
        const cleanEmail = normalizeEmail(email);

        /* ✅ PHONE VALIDATION */
        if (!cleanPhone || !isValidIndianPhone(cleanPhone)) {
            return res.status(400).json({
                error: "Enter a valid 10-digit Indian phone number"
            });
        }

        /* ✅ EMAIL VALIDATION (IF PROVIDED) */
        if (cleanEmail && !isValidEmail(cleanEmail)) {
            return res.status(400).json({
                error: "Invalid email format. Please provide a valid email address."
            });
        }


        /* ✅ BASIC VALIDATION */
        if (!name || !cleanPhone) {
            return res.status(400).json({
                error: "Vendor name and valid contact are required"
            });
        }

        const vendorsRef = ref(db, vendorsPath(type, placeId));
        const snap = await get(vendorsRef);

        /* ⭐ DUPLICATE CHECK (PHONE OR EMAIL) */
        if (snap.exists()) {
            const vendors = Object.values(snap.val());

            const duplicate = vendors.find(v =>
                v.contact === cleanPhone ||
                (cleanEmail && v.email?.toLowerCase() === cleanEmail)
            );

            if (duplicate) {
                return res.status(400).json({
                    error: "Vendor with this contact or email already exists"
                });
            }
        }

        const vendorRef = push(vendorsRef);
        const vendorId = vendorRef.key;
        const now = Date.now();

        const data = {
            vendorId,
            name: name.trim(),
            contact: cleanPhone, // ✅ SAVE NORMALIZED
            email: cleanEmail || "",
            address: address?.trim() || "",
            gst: gst?.trim() || "",
            state: state?.trim() || "",

            isActive: true,

            createdAt: now,
            updatedAt: now
        };

        await set(vendorRef, data);

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Inventory",
            activity: `Vendor added: ${name}`,
        });
        res.locals.skipActivityLog = true;

        res.status(201).json({
            message: "Vendor added successfully",
            vendor: data
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const updateVendor = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId, vendorId } = req.params;

        const vendorsRef = ref(db, vendorsPath(type, placeId));
        const vendorRef = ref(db, `${vendorsPath(type, placeId)}/${vendorId}`);

        const [vendorsSnap, vendorSnap] = await Promise.all([
            get(vendorsRef),
            get(vendorRef)
        ]);

        if (!vendorSnap.exists()) {
            return res.status(404).json({
                error: "Vendor not found"
            });
        }

        const existingVendors = vendorsSnap.val() || {};

        const {
            name,
            contact,
            email,
            address,
            gst,
            state
        } = req.body;
        let cleanPhone;
        let cleanEmail;
        if (name !== undefined && !name.trim()) {
            return res.status(400).json({
                error: "Vendor name cannot be empty"
            });
        }

        if (contact !== undefined) {
            cleanPhone = normalizePhone(contact);

            if (!isValidIndianPhone(cleanPhone)) {
                return res.status(400).json({
                    error: "Enter a valid 10-digit Indian phone number"
                });
            }
        }

        if (email !== undefined) {
            cleanEmail = normalizeEmail(email);
            if (cleanEmail) {
                if (!isValidEmail(cleanEmail)) {
                    return res.status(400).json({
                        error: "Invalid email format. Please provide a valid email address."
                    });
                }
            }
        }

        /* ✅ DUPLICATE CHECK */
        const duplicate = Object.entries(existingVendors).find(
            ([id, vendor]) => {
                if (id === vendorId) return false;

                return (
                    (cleanPhone && vendor.contact === cleanPhone) ||
                    (cleanEmail && vendor.email?.toLowerCase() === cleanEmail)
                );
            }
        );


        /* ✅ SAFE UPDATE OBJECT */
        const updates = {
            updatedAt: Date.now()
        };

        if (name !== undefined) updates.name = name.trim();
        if (contact !== undefined) updates.contact = cleanPhone;
        if (email !== undefined) updates.email = cleanEmail;
        if (address !== undefined) updates.address = address.trim();
        if (gst !== undefined) updates.gst = gst.trim();
        if (state !== undefined) updates.state = state.trim();

        await update(vendorRef, updates);

        res.json({
            message: "Vendor updated successfully",
            updatedFields: updates
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const deleteVendor = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId, vendorId } = req.params;

        const vendorRef = ref(db, `${vendorsPath(type, placeId)}/${vendorId}`);

        await remove(vendorRef);

        res.json({
            message: "Vendor deleted successfully"
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

/*brands*/
export const addBrand = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId } = req.params;
        let { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "Brand name is required"
            });
        }

        const normalizedIncoming = normalizeBrandName(name);

        const brandsRef = ref(db, brandsPath(type, placeId));
        const snap = await get(brandsRef);

        /* ✅ DUPLICATE CHECK */
        if (snap.exists()) {
            const duplicate = Object.values(snap.val()).find(
                b => normalizeBrandName(b.name) === normalizedIncoming
            );

            if (duplicate) {
                return res.status(400).json({
                    error: "Brand already exists"
                });
            }
        }

        const brandRef = push(brandsRef);
        const brandId = brandRef.key;
        const now = Date.now();

        const data = {
            brandId,
            name: name.trim(),

            isActive: true,
            createdAt: now,
            updatedAt: now
        };

        await set(brandRef, data);

        // LOG ACTIVITY
        await logActivity({
            businessId: placeId,
            user: req.user,
            type: "Inventory",
            activity: `Brand added: ${name}`,
        });
        res.locals.skipActivityLog = true;

        res.status(201).json({
            message: "Brand added successfully",
            brand: data
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const updateBrand = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId, brandId } = req.params;
        let { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "Brand name is required"
            });
        }

        const normalizedIncoming = normalizeBrandName(name);

        const brandsRef = ref(db, brandsPath(type, placeId));
        const brandRef = ref(db, `${brandsPath(type, placeId)}/${brandId}`);

        const [brandsSnap, brandSnap] = await Promise.all([
            get(brandsRef),
            get(brandRef)
        ]);

        if (!brandSnap.exists()) {
            return res.status(404).json({
                error: "Brand not found"
            });
        }

        /* ✅ DUPLICATE CHECK */
        const brands = brandsSnap.val() || {};

        const duplicate = Object.entries(brands).find(
            ([id, b]) =>
                id !== brandId &&
                normalizeBrandName(b.name) === normalizedIncoming
        );

        if (duplicate) {
            return res.status(400).json({
                error: "Another brand with this name exists"
            });
        }

        await update(brandRef, {
            name: name.trim(),
            updatedAt: Date.now()
        });

        res.json({
            message: "Brand updated successfully"
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const getBrands = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;

        const { type, placeId } = req.params;
        const snap = await get(ref(db, brandsPath(type, placeId)));
        if (!snap.exists()) {
            return res.json({ error: "No Brands found" });
        }

        res.json(snap.exists() ? snap.val() : {}); // ✅ return object

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
export const deleteBrand = async (req, res) => {
    try {
        if (!authorizeInventoryAccess(req, res)) return;
        const { type, placeId, brandId } = req.params;

        const brandRef = ref(db, `${brandsPath(type, placeId)}/${brandId}`);
        await remove(brandRef);

        res.json({
            message: "Brand deleted successfully"
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};