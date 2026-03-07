import { ref, get, push, set, remove, update } from "firebase/database";
import { db, storage } from "../config/firebase.js";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export const createOffer = async (req, res) => {
  try {
    const { type, placeId, title, description, serviceId, discount, validFrom, validUntil } = req.body;
    const masterEmployeeId = req.user.uid;
    
    if (!type || !placeId || !title || !validFrom || !validUntil) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify Master Employee
    const placePath = `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`;
    const placeSnap = await get(ref(db, placePath));

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: "Place not found" });
    }

    const place = placeSnap.val();
    const userId = String(req.user.uid);
    const isMasterEmployee = String(place.masterEmployeeId) === userId;
    const isOwner = String(place.ownerId) === userId;
    if (!isMasterEmployee && !isOwner) {
      return res.status(403).json({ error: "Only master employee or owner can create offers" });
    }

    const offerRef = push(ref(db, `salonandspa/offers/${type}/${placeId}`));
    const offerId = offerRef.key;

    const offerData = {
      offerId,
      type,
      placeId,
      title,
      description: description || "",
      serviceId: serviceId || "all", 
      discount: Number(discount) || 0,
      validFrom,
      validUntil,
      status: "pending", 
      createdAt: Date.now(),
    };

    /* 📸 HANDLE IMAGE UPLOAD */
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const filePath = `salonandspa/offers/${offerId}-${Date.now()}.${ext}`;
      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(imgRef);
      offerData.image = downloadURL;
      offerData.imagePath = filePath;
    }

    await set(offerRef, offerData);

    return res.status(201).json({ message: "Offer created successfully", offer: offerData });
  } catch (err) {
    console.error("CREATE OFFER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getOffersByPlace = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    if (!type || !placeId) {
      return res.status(400).json({ error: "Missing type or placeId" });
    }

    const offersRef = ref(db, `salonandspa/offers/${type}/${placeId}`);
    const offersSnap = await get(offersRef);

    if (!offersSnap.exists()) {
      return res.json([]);
    }

    // ✅ GET ALL OFFERS (approved + pending + rejected)
const offers = Object.entries(offersSnap.val()).map(
  ([offerId, data]) => ({
    offerId,   // 👈 THIS IS REQUIRED
    ...data
  })
);

    return res.json(offers);
  } catch (err) {
    console.error("GET OFFERS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


export const deleteOffer = async (req, res) => {
  try {
    const { type, placeId, offerId } = req.params;
 
    if (!req.user?.uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = String(req.user.uid);
    console.log(userId)
    /* 🔹 GET USER ROLE FROM DB */
    const userSnap = await get(ref(db, `salonandspa/employees/${userId}`));

    if (!userSnap.exists()) {
      return res.status(403).json({ error: "User record not found" });
    }

    const userRole = String(userSnap.val().role || "")
      .toLowerCase()
      .trim(); // 🔥 IMPORTANT

    /* 🔹 VERIFY PLACE */
    const placePath = `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`;
    const placeSnap = await get(ref(db, placePath));

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: "Place not found" });
    }

    const place = placeSnap.val();
// Normalize role (VERY IMPORTANT)

// Roles that can delete offers

const isMaster = String(place.masterEmployeeId) === userId;
const isOwner = String(place.ownerId) === userId;





    /* 🔹 VERIFY OFFER */
    const offerRef = ref(db, `salonandspa/offers/${type}/${placeId}/${offerId}`);
    const offerSnap = await get(offerRef);

    if (!offerSnap.exists()) {
      return res.status(404).json({ error: "Offer not found" });
    }

    /* 🔹 DELETE */
    await remove(offerRef);

    return res.json({ message: "Offer deleted successfully" });
  } catch (err) {
    console.error("DELETE OFFER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getAllOffers = async (req, res) => {
  try {
    const offersRef = ref(db, `salonandspa/offers`);
    const offersSnap = await get(offersRef);

    if (!offersSnap.exists()) {
      return res.json([]);
    }

    const allOffersData = offersSnap.val();
    const result = [];

    for (const [type, places] of Object.entries(allOffersData)) {
      for (const [placeId, offers] of Object.entries(places)) {
        const placeSnap = await get(ref(db, `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`));
        const place = placeSnap.exists() ? placeSnap.val() : {};
const servicesSnap = await get(ref(db, `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/services`));
const services = servicesSnap.exists() ? servicesSnap.val() : {};

        for (const offer of Object.values(offers)) {
           // Customers only see approved
           if (offer.status !== "approved") continue;

           result.push({
             ...offer,
              serviceNames:
  offer.serviceId === "all"
    ? ["All Services"]
    : Array.isArray(offer.serviceId)
      ? offer.serviceId.map(id =>
          services?.[id]?.name || "Service"
        )
      : [services?.[offer.serviceId]?.name || "Service"],

             placeName: place.name || "Unknown Salon",
             placeAddress: place.address || "",
             placeImage: place.image || "",
             branch: place.branch || ""
           });
        }
      }
    }

    return res.json(result);
  } catch (err) {
    console.error("GET ALL OFFERS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


export const updateOfferStatus = async (req, res) => {
  try {
    const { type, placeId, offerId } = req.params;
    const { status, feedback } = req.body; // 👈 feedback added

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const offerRef = ref(
      db,
      `salonandspa/offers/${type}/${placeId}/${offerId}`
    );

    await update(offerRef, {
      status,
      ...(status === "rejected" && feedback
        ? { feedback }   // 👈 SAVE REJECTION REASON
        : {})
    });

    return res.json({
      message: `Offer status updated to ${status}`
    });
  } catch (err) {
    console.error("UPDATE OFFER STATUS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


export const getPendingOffers = async (req, res) => {
  try {
    const offersRef = ref(db, `salonandspa/offers`);
    const offersSnap = await get(offersRef);

    if (!offersSnap.exists()) {
      return res.json([]);
    }

    const allOffersData = offersSnap.val();
    const result = [];

    for (const [type, places] of Object.entries(allOffersData)) {
      for (const [placeId, offers] of Object.entries(places)) {
        const placeSnap = await get(ref(db, `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`));
        const place = placeSnap.exists() ? placeSnap.val() : {};

        for (const offer of Object.values(offers)) {
           if (offer.status === "pending") {
             result.push({
               ...offer,
               placeName: place.name || "Unknown Salon",
               branch: place.branch || ""
             });
           }
        }
      }
    }

    return res.json(result);
  } catch (err) {
    console.error("GET PENDING OFFERS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const createProductOffer = async (req, res) => {
  try {
    const {
      type,
      placeId,
      title,
      description,
      productIds,
      discount,
      validFrom,
      validUntil
    } = req.body;

    const userId = req.user.uid;

    if (!type || !placeId || !title || !validFrom || !validUntil) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ error: "Select at least one product" });
    }

    /* VERIFY PLACE */
    const placePath = `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`;
    const placeSnap = await get(ref(db, placePath));

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: "Place not found" });
    }

    const place = placeSnap.val();

    const isMaster = String(place.masterEmployeeId) === String(userId);
    const isOwner = String(place.ownerId) === String(userId);

    if (!isMaster && !isOwner) {
      return res.status(403).json({ error: "Unauthorized" });
    }
if (productIds.some(id => !place.inventory?.products[id])) {
    return res.status(404).json({ error: "products not found" });
}
    const offerRef = push(
      ref(db, `salonandspa/offers/${type}/${placeId}`)
    );

    const offerId = offerRef.key;

    const offerData = {
      offerId,
      type,
      placeId,
      title,
      description: description || "",
      offertype:"product",
      productIds,
      discount: Number(discount) || 0,
      validFrom,
      validUntil,
      status: "pending",
      createdAt: Date.now()
    };

    /* IMAGE */
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const filePath = `salonandspa/offers/${offerId}-${Date.now()}.${ext}`;
      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(imgRef);

      offerData.image = downloadURL;
      offerData.imagePath = filePath;
    }

    await set(offerRef, offerData);

    res.status(201).json({
      message: "Product offer created",
      offer: offerData
    });

  } catch (err) {
    console.error("CREATE PRODUCT OFFER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getproductofferbyplace = async (req, res) => {
  try {
    const { type, placeId } = req.params;
    const offersRef = ref(db, `salonandspa/offers/${type}/${placeId}`);
    const offersSnap = await get(offersRef);

    if (!offersSnap.exists()) {
      return res.json([]);
    }

    const offersData = offersSnap.val();
    const result = [];

    for (const offer of Object.values(offersData)) {
      if (offer.offertype === "product") {
        result.push({
      productoffer:offer
        });
      }
    }

    return res.json(result);
  } catch (err) {
    console.error("GET PRODUCT OFFER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const deleteProductOffer = async (req, res) => {
  try {
    const { type, placeId, offerId } = req.params;
    const userId = req.user.uid;

    const placeSnap = await get(
      ref(db, `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`)
    );

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: "Place not found" });
    }

    const place = placeSnap.val();

    const isMaster = String(place.masterEmployeeId) === String(userId);
    const isOwner = String(place.ownerId) === String(userId);

    if (!isMaster && !isOwner) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await remove(
      ref(db, `salonandspa/offers/${type}/${placeId}/${offerId}`)
    );

    res.json({ message: "Product offer deleted" });

  } catch (err) {
    console.error("DELETE PRODUCT OFFER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllProductOffers = async (req, res) => {
  try {
    const offersSnap = await get(ref(db, `salonandspa/offers`));
console.log(offersSnap.val())
    if (!offersSnap.exists()) return res.json([]);

    const result = [];

    const data = offersSnap.val();

    for (const [type, places] of Object.entries(data)) {
      for (const [placeId, offers] of Object.entries(places)) {

        const placeSnap = await get(
          ref(db, `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`)
        );

        const place = placeSnap.exists() ? placeSnap.val() : {};

        const productsSnap = await get(
          ref(db, `${type === "salon" ? "salonandspa/salons" : "salonandspa/spas"}/${placeId}/inventory/products`)
        );

        const products = productsSnap.exists() ? productsSnap.val() : {};

        for (const offer of Object.values(offers)) {
if(offer.offertype !== "product") continue;
          // if (offer.status !== "approved") continue;
const ids = offer.productIds || [];

          const productNames =
            ids.includes("all")
              ? ["All Products"]
              : ids.map(id =>
                  products[id]?.name || "Product"
                );

          result.push({
            ...offer,
            productNames,
            placeName: place.name || "",
            placeImage: place.image || ""
          });
        }
      }
    }

    res.json(result);

  } catch (err) {
    console.error("GET ALL PRODUCT OFFERS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
