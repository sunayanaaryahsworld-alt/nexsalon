import {
  ref,
  get,
  push,
  update,
  query,
  orderByChild,
  equalTo,
  set,
  runTransaction,
} from "firebase/database";
import { db, storage } from "../config/firebase.js";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { logActivity } from "./activityLogController.js";
const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const createAfterPayment = async (req, res) => {
  try {
    const adminId = req.user.uid;

    const {
      type, // salon | spa
      name,
      branch,
      durationDays,
      address,
      plan, // basic | standard | premium
      paymentId,
      amount,
      openTime,
      closeTime,
      addonBusinesses,
    } = req.body;

    const isTrial = plan.toLowerCase() === "trial";

    /* ---------------- VALIDATION ---------------- */
    if (
      !type ||
      !name ||
      !branch ||
      !address ||
      !plan ||
      (!isTrial && !paymentId) ||
      !openTime ||
      !closeTime
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid business type" });
    }

    // /* ---------------- PLAN CONFIG ---------------- */
    // const PLAN_DURATION = {
    //   basic: 30,
    //   standard: 90,
    //   premium: 365,
    // };

    // const PLAN_LIMIT = {
    //   basic: 1,
    //   standard: 2,
    //   premium: 5,
    // };

    // if (!PLAN_DURATION[plan]) {
    //   return res.status(400).json({ error: "Invalid subscription plan" });
    // }

    // const now = Date.now();
    // const expiresAt =
    //   now + PLAN_DURATION[plan] * 24 * 60 * 60 * 1000;

    // const basePath = type === "salon" ? "salons" : "spas";

    // /* ---------------- ADMIN FETCH ---------------- */
    // const adminRef = ref(db, `salonandspa/admin/${adminId}`);
    // const adminSnap = await get(adminRef);

    // if (!adminSnap.exists()) {
    //   return res.status(404).json({ error: "Admin not found" });
    // }

    // const adminData = adminSnap.val();

    // const salonCount = adminData.salonCount || 0;
    // const spaCount = adminData.spaCount || 0;

    // const remainingCount =
    //   adminData.subscription?.remainingCount ??
    //   PLAN_LIMIT[plan];

    // /* ---------------- PLAN LIMIT CHECK ---------------- */
    // if (remainingCount <= 0) {
    //   return res.status(403).json({
    //     error: `Your ${plan} plan branch limit is exhausted`
    //   });
    // }

    /* ---------------- FETCH PLAN FROM FIREBASE ---------------- */
    const plansRef = ref(db, "salonandspa/plans");
    const plansSnap = await get(plansRef);

    if (!plansSnap.exists()) {
      return res.status(500).json({ error: "No plans found in database" });
    }

    const allPlans = plansSnap.val();

    // Find the plan by planname and ensure it's active
    const planEntry = Object.values(allPlans).find(
      (p) =>
        (p.planName || p.planname)?.toLowerCase() === plan.toLowerCase() &&
        p.isActive === true,
    );

    if (!planEntry) {
      return res
        .status(400)
        .json({ error: "Invalid or inactive subscription plan" });
    }

    const selectedPricing = planEntry.pricing?.find(
      (p) => Number(p.durationDays) === Number(durationDays),
    );

    if (!selectedPricing) {
      return res.status(400).json({
        error: "Invalid plan duration selected",
      });
    }

    const PLAN_DURATION = selectedPricing.durationDays;
    const BASE_LIMIT = Number(selectedPricing.maxBusinesses) || 0;
    const ADDON_LIMIT = Number(addonBusinesses) || 0;
    const PLAN_LIMIT = BASE_LIMIT + ADDON_LIMIT;


    const now = Date.now();
    const expiresAt = now + PLAN_DURATION * 24 * 60 * 60 * 1000;

    const basePath = type === "salon" ? "salons" : "spas";

    /* ---------------- ADMIN FETCH ---------------- */
    const adminRef = ref(db, `salonandspa/admin/${adminId}`);
    const adminSnap = await get(adminRef);

    if (!adminSnap.exists()) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const adminData = adminSnap.val();

    const salonCount = adminData.salonCount || 0;
    const spaCount = adminData.spaCount || 0;


    const previousRemaining = adminData.subscription?.remainingCount ?? 0;

    const remainingCount = previousRemaining > 0 ? previousRemaining + ADDON_LIMIT : PLAN_LIMIT;


    /* ---------------- PLAN LIMIT CHECK ---------------- */
    if (remainingCount <= 0) {
      return res.status(403).json({
        error: `Your ${plan} plan branch limit is exhausted`,
      });
    }
    /* ---------------- DUPLICATE BRANCH CHECK ---------------- */
    const allSnap = await get(ref(db, `salonandspa/${basePath}`));

    if (allSnap.exists()) {
      const exists = Object.values(allSnap.val()).some(
        (item) =>
          item.ownerId === adminId &&
          item.branch?.toLowerCase() === branch.toLowerCase(),
      );

      if (exists) {
        return res.status(409).json({
          error: `${type} already exists for this branch`,
        });
      }
    }

    /* ---------------- TIMINGS ---------------- */
    const DAYS = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    const timings = {};
    DAYS.forEach((day) => {
      timings[day] = {
        isOpen: true,
        open: openTime,
        close: closeTime,
      };
    });

    /* ---------------- CREATE BUSINESS ---------------- */
    const businessRef = push(ref(db, `salonandspa/${basePath}`));
    const businessId = businessRef.key;

    const businessSubscription = {
      planName: plan,
      durationDays: PLAN_DURATION,
      status: isTrial ? "trial" : "active",
      paymentId: isTrial ? null : paymentId,
      amount,
      addonBusinesses: ADDON_LIMIT,
      purchasedAt: now,
      expiresAt,
    };

    await set(businessRef, {
      id: businessId,
      ownerId: adminId,
      type,
      name,
      address,
      branch,
      timings,
      subscription: businessSubscription,
      createdAt: now,
    });

    /* ---------------- UPDATE ADMIN ---------------- */
    const nextSalonCount = type === "salon" ? salonCount + 1 : salonCount;
    const nextSpaCount = type === "spa" ? spaCount + 1 : spaCount;

    const adminSubscription = {
      planName: plan,
      durationDays: PLAN_DURATION,
      status: isTrial ? "trial" : "active",
      paymentId: isTrial ? null : paymentId,
      amount,
      expiresAt,
      addonBusinesses: ADDON_LIMIT,      // 👈 STORE IT
      maxBusinesses: PLAN_LIMIT,
      remainingCount: remainingCount - 1,
    };

    const updatePayload = {
      salonCount: nextSalonCount,
      spaCount: nextSpaCount,
      subscription: adminSubscription,
    };

    updatePayload[
      type === "salon" ? `salonid${nextSalonCount}` : `spaid${nextSpaCount}`
    ] = businessId;

    await update(adminRef, updatePayload);

    /* ---------------- RESPONSE ---------------- */
    return res.status(201).json({
      message: `${type} created successfully`,
      businessId,
      remainingCount: adminSubscription.remainingCount,
      subscription: adminSubscription,
    });
  } catch (error) {
    console.error("CREATE AFTER PAYMENT ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getAdminSubscriptions = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const now = Date.now();

    const salonsSnap = await get(ref(db, "salonandspa/salons"));
    const spasSnap = await get(ref(db, "salonandspa/spas"));

    const result = [];

    // ---------- SALONS ----------
    if (salonsSnap.exists()) {
      Object.values(salonsSnap.val()).forEach((salon) => {
        if (salon.ownerId === adminId) {
          const expiresAt = salon.subscription?.expiresAt || 0;
          const isExpired = now > expiresAt;

          result.push({
            type: "salon",
            id: salon.id,
            name: salon.name,
            branch: salon.branch,
            plan: salon.subscription?.plan,
            status: isExpired ? "expired" : "active",
            expiresAt,
            remainingDays: isExpired
              ? 0
              : Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)),
          });
        }
      });
    }

    // ---------- SPAS ----------
    if (spasSnap.exists()) {
      Object.values(spasSnap.val()).forEach((spa) => {
        if (spa.ownerId === adminId) {
          const expiresAt = spa.subscription?.expiresAt || 0;
          const isExpired = now > expiresAt;

          result.push({
            type: "spa",
            id: spa.id,
            name: spa.name,
            branch: spa.branch,
            plan: spa.subscription?.plan,
            status: isExpired ? "expired" : "active",
            expiresAt,
            remainingDays: isExpired
              ? 0
              : Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)),
          });
        }
      });
    }

    return res.json({
      adminId,
      totalBusinesses: result.length,
      subscriptions: result,
    });
  } catch (err) {
    console.error("GET ADMIN SUBSCRIPTIONS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET SINGLE SUBSCRIPTION BY SALON/SPA ID
 * ✅ ADDED FOR RECEPTIONIST DASHBOARD
 * Used by: Receptionists to view their assigned salon's subscription
 * Access: Receptionists fetch their salon subscription data
 * URL: GET /api/admin/subscription/:salonId
 * Response: Returns subscription details for the specific salon/spa
 */
export const getSingleSubscription = async (req, res) => {
  try {
    const { salonId } = req.params;
    const now = Date.now();

    if (!salonId) {
      return res.status(400).json({ error: "Salon ID required" });
    }

    // Check if it's a salon
    const salonRef = ref(db, `salonandspa/salons/${salonId}`);
    const salonSnap = await get(salonRef);

    if (salonSnap.exists()) {
      const salon = salonSnap.val();
      const expiresAt = salon.subscription?.expiresAt || 0;
      const isExpired = now > expiresAt;

      return res.json({
        type: "salon",
        id: salonId,
        name: salon.name,
        branch: salon.branch,
        plan: salon.subscription?.plan,
        status: isExpired ? "expired" : "active",
        expiresAt,
        remainingDays: isExpired
          ? 0
          : Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)),
      });
    }

    // Check if it's a spa
    const spaRef = ref(db, `salonandspa/spas/${salonId}`);
    const spaSnap = await get(spaRef);

    if (spaSnap.exists()) {
      const spa = spaSnap.val();
      const expiresAt = spa.subscription?.expiresAt || 0;
      const isExpired = now > expiresAt;

      return res.json({
        type: "spa",
        id: salonId,
        name: spa.name,
        branch: spa.branch,
        plan: spa.subscription?.plan,
        status: isExpired ? "expired" : "active",
        expiresAt,
        remainingDays: isExpired
          ? 0
          : Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)),
      });
    }

    return res.status(404).json({ error: "Salon/Spa not found" });
  } catch (err) {
    console.error("GET SINGLE SUBSCRIPTION ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * UPDATE SALON DETAILS + IMAGE
 * Only OWNER (admin/superadmin) can update
 */

const ALLOWED_GENDERS = ["Male", "Female", "Unisex"];

export const updatePlaceDetails = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { placeId, type } = req.params; // ✅ use placeId
    const { name, address, pincode, gstNumber, phone, email, website, gender, description, timings, latitude, longitude } =
      req.body || {};
    if (!placeId || !type) {
      return res.status(400).json({ error: "placeId and type are required" });
    }

    if (!["salon", "spa"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Invalid type. Must be salon or spa" });
    }

    /* 🔁 Dynamic base path */
    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    /* 🔍 Get Place */
    const placeRef = ref(db, `${basePath}/${placeId}`); // ✅ fixed
    const placeSnap = await get(placeRef);

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    const placeData = placeSnap.val();

    /* 🔐 Ownership check */
    if (placeData.ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (pincode) updateData.pincode = pincode;
    if (gstNumber) updateData.gstNumber = gstNumber;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (website) updateData.website = website;
    if (description) updateData.description = description;
    if (timings) updateData.timings = timings;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    /* 👤 Gender validation */
    if (gender !== undefined) {
      if (!ALLOWED_GENDERS.includes(gender)) {
        return res.status(400).json({
          error: "Invalid gender type. Allowed: Male, Female, Unisex",
        });
      }
      updateData.gender = gender;
    }
    /* 🕒 Timings update (partial merge allowed) */
    /* 🕒 Timings update (Handles both Object and String) */
    if (timings) {
      let parsedTimings = timings;

      // If it's a string, try to parse it. If it's already an object, skip parsing.
      if (typeof timings === "string") {
        try {
          parsedTimings = JSON.parse(timings);
        } catch (e) {
          console.error("Failed to parse timings string:", e);
          // If parsing fails, it's likely not a JSON string, so we skip this field
          parsedTimings = null;
        }
      }

      if (parsedTimings && typeof parsedTimings === "object") {
        const DAYS = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];
        const existingTimings = placeData.timings || {};
        const updatedTimings = { ...existingTimings };

        for (const day of Object.keys(parsedTimings)) {
          const lowerDay = day.toLowerCase();
          if (!DAYS.includes(lowerDay)) continue;

          const dayData = parsedTimings[day];

          updatedTimings[lowerDay] = {
            isOpen:
              dayData.isOpen ?? (existingTimings[lowerDay]?.isOpen || false),
            open: dayData.open || existingTimings[lowerDay]?.open || "",
            close: dayData.close || existingTimings[lowerDay]?.close || "",
          };
        }
        updateData.timings = updatedTimings;
      }
    }

    /* 📸 IMAGE → FIREBASE STORAGE (SALON + SPA BOTH) */
    if (req.file) {
      // 🔥 delete old image if exists
      if (placeData.imagePath) {
        try {
          await deleteObject(storageRef(storage, placeData.imagePath));
        } catch (e) {
          console.warn("OLD IMAGE DELETE FAILED:", e.message);
        }
      }

      const ext = req.file.originalname.split(".").pop();

      // 🔁 Dynamic path based on type (salon / spa)
      // basePath is already:
      // salon  → salonandspa/salons
      // spa    → salonandspa/spas
      const filePath = `${basePath}/${placeId}/image-${Date.now()}.${ext}`;

      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(imgRef);

      updateData.image = downloadURL; // frontend usage
      updateData.imagePath = filePath; // storage lifecycle
    }

    updateData.updatedAt = Date.now();

    await update(placeRef, updateData);

    return res.json({
      message: `${type} updated successfully`,
      placeId,
      updatedFields: Object.keys(updateData),
    });
  } catch (err) {
    console.error("UPDATE PLACE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const viewPlaceDetails = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { id, type } = req.body;

    if (!id || !type) {
      return res.status(400).json({
        error: "id and type are required",
      });
    }

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({
        error: "type must be salon or spa",
      });
    }

    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    /**
     * 1️⃣ Fetch salon / spa
     */
    const placeRef = ref(db, `${basePath}/${id}`);
    const placeSnap = await get(placeRef);

    if (!placeSnap.exists()) {
      return res.status(404).json({
        error: `${type} not found`,
      });
    }

    const place = placeSnap.val();

    /**
     * 2️⃣ Ownership check
     */
    if (place.ownerId !== adminId) {
      return res.status(403).json({
        error: "You are not authorized to view this",
      });
    }

    /**
     * 3️⃣ Fetch employees
     */
    let employees = [];
    if (place.employees) {
      const empIds = Object.keys(place.employees);

      const empSnap = await get(ref(db, "salonandspa/employees"));
      if (empSnap.exists()) {
        const allEmployees = empSnap.val();

        employees = empIds
          .map((empId) => allEmployees[empId])
          .filter(Boolean)
          .map((emp) => ({
            empid: emp.empid,
            name: emp.name,
            phone: emp.phone,
            role: emp.role,
            experience: emp.experience || "",
            salary: emp.salary || "",
            isActive: emp.isActive,
            services: emp.assignments?.[id]?.services || [],
            linkedAt: place.employees?.[emp.empid]?.linkedAt || null,
          }));
      }
    }

    /**
     * 4️⃣ Master employee (ONLY FOR SALON)
     */
    let masterEmployee = null;
    if (place.masterEmployeeId) {
      const masterSnap = await get(
        ref(db, `salonandspa/employees/${place.masterEmployeeId}`),
      );

      if (masterSnap.exists()) {
        const m = masterSnap.val();
        masterEmployee = {
          empid: m.empid,
          name: m.name,
          phone: m.phone,
          role: m.role,
          experience: m.experience || "",
          isActive: m.isActive,
        };
      }
    }

    /**
     * 5️⃣ Services
     */
    const services = place.services
      ? Object.values(place.services).map((s) => ({
        serviceId: s.serviceId,
        name: s.name?.trim(),
        category: s.category?.trim() || "",
        price: s.price,
        duration: s.duration,
        image: s.image || "",
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt || null,
      }))
      : [];

    /**
     * 6️⃣ Final response
     */
    return res.json({
      type,
      details: {
        id,
        name: place.name,
        branch: place.branch || "",
        address: place.address || "",
        pincode: place.pincode || "",
        phone: place.phone || "",
        email: place.email || "",
        website: place.website || "",
        gstNumber: place.gstNumber || "",
        gender: place.gender || "",
        description: place.description || "",
        image: place.image || "",
        timings: place.timings || {},
        latitude: place.latitude || 0,
        longitude: place.longitude || 0,
        createdAt: place.createdAt,
        updatedAt: place.updatedAt || null,
      },
      subscription: place.subscription || null,
      masterEmployee,
      employees,
      services,
    });
  } catch (err) {
    console.error("VIEW PLACE ERROR:", err);
    return res.status(500).json({
      error: "Server error",
    });
  }
};
// export const addEmployee = async (req, res) => {
//   try {
//     const adminId = req.user.uid;
//     const { salonId } = req.params;

//     const {
//       name,
//       phone,
//       role,
//       email,
//       experience,
//       salary
//     } = req.body;

//     if (!name || !phone || !role) {
//       return res.status(400).json({
//         error: "Name, phone and role are required"
//       });
//     }

//     /**
//      * 🔍 Check salon
//      */
//     const salonRef = ref(db, `salonandspa/salons/${salonId}`);
//     const salonSnap = await get(salonRef);

//     if (!salonSnap.exists()) {
//       return res.status(404).json({ error: "Salon not found" });
//     }

//     const salonData = salonSnap.val();

//     if (salonData.ownerId !== adminId) {
//       return res.status(403).json({ error: "Unauthorized" });
//     }

//     /**
//      * 🚫 PHONE UNIQUE CHECK
//      */
//     const empRef = ref(db, "salonandspa/employees");
//     const phoneQuery = query(empRef, orderByChild("phone"), equalTo(phone));
//     const phoneSnap = await get(phoneQuery);

//     if (phoneSnap.exists()) {
//       return res.status(400).json({
//         error: "Employee with this phone number already exists"
//       });
//     }

//     /**
//      * 👤 Create employee
//      */
//     const employeeRef = push(ref(db, "salonandspa/employees"));
//     const employeeId = employeeRef.key;

//     const employeeData = {
//       empid: employeeId,
//       name,
//       phone,
//       role,
//       email: email || "",
//       experience: experience || "0",
//       salary: salary || "0",
//       salonId,
//       ownerId: adminId,
//       createdBy: adminId,
//       createdAt: Date.now()
//     };

//     /**
//      * 🧩 Store employeeId directly inside salon
//      */
//     const existingEmpKeys = Object.keys(salonData)
//       .filter(k => k.startsWith("empId"));

//     const salonEmpKey = `empId${existingEmpKeys.length + 1}`;

//     const updates = {};
//     updates[`salonandspa/employees/${employeeId}`] = employeeData;
//     updates[`salonandspa/salons/${salonId}/${salonEmpKey}`] = employeeId;

//     await update(ref(db), updates);

//     // LOG ACTIVITY
//     await logActivity({
//       businessId: salonId,
//       user: { uid: adminId, role: "admin" }, // req.user might be available differently in admin routes, verifying... usually middleware sets req.user
//       type: "Staff",
//       activity: `Staff added: ${name}`,
//     });
//     res.locals.skipActivityLog = true;

//     return res.status(201).json({
//       message: "Employee added successfully",
//       employeeId,
//       salonEmpKey
//     });

//   } catch (err) {
//     console.error("ADD EMPLOYEE ERROR:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

const genders = ["Male", "Female", "Other"];
export const addEmployee = async (req, res) => {
  try {
    const ownerId = req.user.uid; // 👑 owner / admin id

    const { name, phone, role, email, gender, experience, salary, joiningDate } = req.body;

    if (!name || !phone || !role || !gender) {
      return res.status(400).json({
        error: "Name, phone, role and gender are required",
      });
    }
    if (!genders.includes(gender)) {
      return res.status(400).json({
        error: "Invalid gender. Allowed values: Male, Female, Other",
      });
    }

    /**
     * 🚫 PHONE UNIQUE CHECK (GLOBAL)
     */
    const empRef = ref(db, "salonandspa/employees");
    const phoneQuery = query(empRef, orderByChild("phone"), equalTo(phone));
    const phoneSnap = await get(phoneQuery);

    if (phoneSnap.exists()) {
      return res.status(400).json({
        error: "Employee with this phone number already exists",
      });
    }

    /**
     * 👤 Create employee (GLOBAL)
     */
    const employeeRef = push(empRef);
    const employeeId = employeeRef.key;

    const employeeData = {
      empid: employeeId,
      name,
      phone,
      role,
      gender,
      email: email || "",
      experience: experience || "0",
      salary: salary || "0", // optional reference
      joiningDate: joiningDate || new Date().toISOString().split('T')[0], // ✅ Added joiningDate
      ownerId, // ✅ owner id
      createdBy: ownerId,
      isActive: true, // ✅ ACTIVE BY DEFAULT
      createdAt: Date.now(),
    };
    /* 📸 IMAGE → FIREBASE STORAGE */
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();

      const filePath = `salonandspa/employees/${employeeId}-${Date.now()}.${ext}`;

      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(imgRef);

      // ✅ STORE BOTH
      employeeData.image = downloadURL;
      employeeData.imagePath = filePath;
    } else {
      employeeData.image = "";
      employeeData.imagePath = "";
    }

    await set(employeeRef, employeeData);

    // LOG ACTIVITY
    await logActivity({
      businessId: ownerId, // Assuming ownerId is the business context for global employees
      user: req.user,
      type: "Staff",
      activity: `New staff added: ${name}`,
    });
    res.locals.skipActivityLog = true;

    return res.status(201).json({
      message: "Employee added successfully",
      employeeId,
      employee: employeeData,
    });
  } catch (err) {
    console.error("ADD EMPLOYEE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { employeeId } = req.params;

    const { name, phone, role, email, experience, salary, joiningDate } = req.body || {};

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    /**
     * 🔍 Check employee exists
     */
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const empData = empSnap.val();

    // 🚫 BLOCK UPDATE IF SERVICE IS INACTIVE
    if (empData.isActive === false) {
      return res.status(400).json({
        error: "Inactive employee cannot be updated",
      });
    }
    /**
     * 🔐 Ownership check
     */
    if (empData.ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    /**
     * 🚫 Phone duplicate check (if phone changed)
     */
    if (phone && phone !== empData.phone) {
      const empListRef = ref(db, "salonandspa/employees");
      const phoneQuery = query(
        empListRef,
        orderByChild("phone"),
        equalTo(phone),
      );

      const phoneSnap = await get(phoneQuery);
      if (phoneSnap.exists()) {
        return res.status(400).json({
          error: "Another employee already uses this phone number",
        });
      }
    }

    /**
     * 🧱 Build update object
     */
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (email) updateData.email = email;
    if (experience) updateData.experience = experience;
    if (salary) updateData.salary = salary;
    if (joiningDate) updateData.joiningDate = joiningDate;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
      });
    }
    // 🔥 If new image uploaded → send to Firebase
    if (req.file) {
      const oldImagePath = empSnap.val().imagePath;

      // delete old image (optional but clean)
      if (oldImagePath) {
        try {
          await deleteObject(storageRef(storage, oldImagePath));
        } catch (e) {
          console.log("Old image delete skipped:", e.message);
        }
      }

      const ext = req.file.originalname.split(".").pop();

      // 📁 Employee storage path
      const filePath = `salonandspa/employees/${employeeId}-${Date.now()}.${ext}`;

      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(imgRef);

      // ✅ Update DB fields
      updateData.image = downloadURL;
      updateData.imagePath = filePath;
    }

    updateData.updatedAt = Date.now();

    await update(empRef, updateData);

    // LOG ACTIVITY
    await logActivity({
      businessId: empData.ownerId, // Assuming ownerId is the business context for global employees
      user: req.user,
      type: "Staff",
      activity: `Staff updated: ${empData.name || employeeId}`,
    });
    res.locals.skipActivityLog = true;

    return res.json({
      message: "Employee updated successfully",
      employeeId,
      updatedFields: Object.keys(updateData),
    });
  } catch (err) {
    console.error("UPDATE EMPLOYEE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getPlaceEmployees = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { type, placeId } = req.params;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "type must be salon or spa" });
    }

    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    /**
     * 🔍 Check place exists
     */
    const placeRef = ref(db, `${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    const placeData = placeSnap.val();

    /**
     * 🔐 Ownership check
     */
    if (!adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    /**
     * 🧩 Get employee IDs from place
     * (works for both salon and spa)
     */
    if (!placeData.employees) {
      return res.json({
        type,
        placeId,
        totalEmployees: 0,
        employees: [],
      });
    }

    const empIds = Object.keys(placeData.employees);

    /**
     * 📥 Fetch only ACTIVE employees
     */
    const employees = (await Promise.all(empIds.map(async (empId) => {
      const empRef = ref(db, `salonandspa/employees/${empId}`);
      const empSnap = await get(empRef);

      if (!empSnap.exists()) return null;

      const empData = empSnap.val();

      return {
        employeeId: empId,
        ...empData,
        linkedAt: placeData.employees[empId]?.linkedAt || null,
      };
    }))).filter(Boolean);

    return res.json({
      type,
      placeId,
      masterEmployeeId: placeData.masterEmployeeId || null,
      totalEmployees: employees.length,
      employees,
    });
  } catch (err) {
    console.error("GET PLACE EMPLOYEES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deactivateEmployee = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { salonId, employeeId } = req.params;

    /**
     * 🔍 Check salon
     */
    const salonRef = ref(db, `salonandspa/salons/${salonId}`);
    const salonSnap = await get(salonRef);

    if (!salonSnap.exists()) {
      return res.status(404).json({ error: "Salon not found" });
    }

    const salonData = salonSnap.val();

    if (salonData.ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    /**
     * 🔍 Check employee
     */
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const empData = empSnap.val();

    if (empData.ownerId !== adminId || empData.salonId !== salonId) {
      return res.status(403).json({ error: "Unauthorized employee access" });
    }

    /**
     * 🧹 Remove employee reference from salon
     */
    const updates = {};

    Object.keys(salonData).forEach((key) => {
      if (key.startsWith("empId") && salonData[key] === employeeId) {
        updates[`salonandspa/salons/${salonId}/${key}`] = null;
      }
    });

    /**
     * 🚫 Mark employee inactive
     */
    updates[`salonandspa/employees/${employeeId}/isActive`] = false;
    updates[`salonandspa/employees/${employeeId}/deactivatedAt`] = Date.now();

    await update(ref(db), updates);

    // LOG ACTIVITY
    await logActivity({
      businessId: salonId,
      user: req.user,
      type: "Staff",
      activity: `Staff deactivated: ${empData.name || employeeId}`,
    });
    res.locals.skipActivityLog = true;

    return res.json({
      message: "Employee deactivated successfully",
      employeeId,
    });
  } catch (err) {
    console.error("DEACTIVATE EMPLOYEE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * FIXED DEACTIVATE CONTROLLER
 * Supports multiple salon/spa links (salonid1, spaid1, etc.)
 */
export const deactivateStaffNew = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { type, placeId, employeeId } = req.params;

    if (!employeeId || !placeId || !type) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const basePath = type === "salon" ? "salonandspa/salons" : "salonandspa/spas";
    const prefix = type === "salon" ? "salonid" : "spaid";

    // 1. Check Place Existence & Ownership
    const placeRef = ref(db, `${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);
    if (!placeSnap.exists()) return res.status(404).json({ error: "Business not found" });
    if (placeSnap.val().ownerId !== adminId) return res.status(403).json({ error: "Unauthorized business access" });

    // 2. Check Employee Existence & Ownership & Link
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);
    if (!empSnap.exists()) return res.status(404).json({ error: "Employee not found" });

    const empData = empSnap.val();
    if (empData.ownerId !== adminId) return res.status(403).json({ error: "Unauthorized employee access" });

    // 🧩 Check if linked to this place (matches salonid1, salonid2, spaId etc.)
    const placeData = placeSnap.val();
    const hasInverseLink = placeData.employees && placeData.employees[employeeId];

    const isLinked = hasInverseLink || Object.keys(empData).some(
      (key) => (key === `${type}Id` || key.startsWith(prefix)) && empData[key] === placeId
    );

    // Allow if owner matches OR if linked (fixing issue where receptionist-added staff have no ownerId)
    const isOwner = empData.ownerId === adminId;
    if (!isOwner && !isLinked) {
      return res.status(403).json({ error: "Unauthorized access to this employee" });
    }

    if (!isLinked) {
      return res.status(400).json({ error: "Employee not linked to this business" });
    }

    // 3. Perform Updates (Atomic)
    const updates = {};

    // 🔴 DO NOT REMOVE LINK - Keeps history & allows reactivity visibility
    // updates[`${basePath}/${placeId}/employees/${employeeId}`] = null;

    // Legacy support (don't remove either)
    // const placeData = placeSnap.val();
    // Object.keys(placeData).forEach((k) => {
    //   if (k.startsWith("empId") && placeData[k] === employeeId) {
    //     updates[`${basePath}/${placeId}/${k}`] = null;
    //   }
    // });

    // Globally mark inactive
    updates[`salonandspa/employees/${employeeId}/isActive`] = false;
    updates[`salonandspa/employees/${employeeId}/deactivatedAt`] = Date.now();
    updates[`salonandspa/employees/${employeeId}/deactivatedBy`] = adminId;

    await update(ref(db), updates);

    return res.json({ success: true, message: "Staff deactivated successfully" });
  } catch (err) {
    console.error("DEACTIVATE STAFF ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const reactivateStaffNew = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { type, placeId, employeeId } = req.params;

    if (!employeeId || !placeId || !type) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const basePath = type === "salon" ? "salonandspa/salons" : "salonandspa/spas";
    const prefix = type === "salon" ? "salonid" : "spaid";

    // 1. Check Place Existence & Ownership
    const placeRef = ref(db, `${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);
    if (!placeSnap.exists()) return res.status(404).json({ error: "Business not found" });
    if (placeSnap.val().ownerId !== adminId) return res.status(403).json({ error: "Unauthorized business access" });

    // 2. Check Employee
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);
    if (!empSnap.exists()) return res.status(404).json({ error: "Employee not found" });

    const empData = empSnap.val();

    // Link check
    // Check placeData.employees as well
    const placeData = placeSnap.val();
    const hasInverseLink = placeData.employees && placeData.employees[employeeId];

    const isLinked = hasInverseLink || Object.keys(empData).some(
      (key) => (key === `${type}Id` || key.startsWith(prefix)) && empData[key] === placeId
    );

    if (!isLinked) {
      return res.status(400).json({ error: "Employee not linked to this business" });
    }

    // 3. Reactivate
    await update(empRef, {
      isActive: true, // ✅ Reactivate
      reactivatedAt: Date.now(),
      reactivatedBy: adminId
    });

    return res.json({ success: true, message: "Staff reactivated successfully" });
  } catch (err) {
    console.error("REACTIVATE STAFF ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const activateEmployee = async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRole = req.user.role; // superadmin
    const { salonId, employeeId } = req.params;

    /**
     * 🔐 SUPERADMIN CHECK
     */
    if (userRole !== "superadmin") {
      return res.status(403).json({
        error: "Access denied. Superadmin only.",
      });
    }

    /**
     * 🔍 Check salon exists
     */
    const salonRef = ref(db, `salonandspa/salons/${salonId}`);
    const salonSnap = await get(salonRef);

    if (!salonSnap.exists()) {
      return res.status(404).json({ error: "Salon not found" });
    }

    /**
     * 🔍 Check employee exists
     */
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const empData = empSnap.val();

    /**
     * 🧩 Validate employee belongs to salon
     */
    if (empData.salonId !== salonId) {
      return res.status(400).json({
        error: "Employee does not belong to this salon",
      });
    }

    /**
     * ✅ ACTIVATE EMPLOYEE
     */
    await update(empRef, {
      isActive: true,
      activatedBy: userId,
      activatedAt: Date.now(),
    });

    // LOG ACTIVITY
    await logActivity({
      businessId: salonId,
      user: req.user,
      type: "Staff",
      activity: `Staff activated: ${empData.name || employeeId}`,
    });
    res.locals.skipActivityLog = true;

    return res.json({
      message: "Employee activated successfully",
      employeeId,
    });
  } catch (err) {
    console.error("ACTIVATE EMPLOYEE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const setMasterEmployee = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const userRole = req.user.role; // admin | superadmin
    const { type, placeId, employeeId } = req.params;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "type must be salon or spa" });
    }

    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    /* ---------------- CHECK PLACE (SALON/SPA) ---------------- */
    const placeRef = ref(db, `${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    const placeData = placeSnap.val();

    /* ---------------- OWNER / SUPERADMIN ---------------- */
    if (placeData.ownerId !== adminId && userRole !== "superadmin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    /* ---------------- CHECK EMPLOYEE ---------------- */
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const empData = empSnap.val();

    /* ---------------- VALIDATE EMPLOYEE → PLACE LINK ---------------- */
    const linkKey = type === "salon" ? "salonid" : "spaid";
    const belongsToPlace = Object.keys(empData).some(
      (key) => key.startsWith(linkKey) && empData[key] === placeId,
    );

    if (!belongsToPlace) {
      return res.status(400).json({
        error: `Employee does not belong to this ${type}`,
      });
    }

    /* ---------------- SET MASTER EMPLOYEE ---------------- */
    await update(placeRef, {
      masterEmployeeId: employeeId,
      masterAssignedAt: Date.now(),
      masterAssignedBy: adminId,
    });

    return res.json({
      message: "Master employee assigned successfully",
      type,
      placeId,
      masterEmployeeId: employeeId,
    });
  } catch (err) {
    console.error("SET MASTER EMPLOYEE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const removeMasterEmployee = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const userRole = req.user.role;
    const { type, placeId } = req.params;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "type must be salon or spa" });
    }

    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    const placeRef = ref(db, `${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    const placeData = placeSnap.val();

    if (placeData.ownerId !== adminId && userRole !== "superadmin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await update(placeRef, {
      masterEmployeeId: null,
      masterUnassignedAt: Date.now(),
      masterUnassignedBy: adminId,
    });

    return res.json({
      message: "Master employee removed successfully",
      type,
      placeId,
    });
  } catch (err) {
    console.error("REMOVE MASTER EMPLOYEE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const addSalonService = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { salonId } = req.params;

    const {
      name,
      price,
      duration,
      category,
      description,
      assignedEmployees = [], // 👈 NEW
    } = req.body;

    if (!name || !price || !duration) {
      return res.status(400).json({
        error: "Name, price, duration required",
      });
    }

    /* 🔐 SALON + OWNER CHECK */
    const salonRef = ref(db, `salonandspa/salons/${salonId}`);
    const salonSnap = await get(salonRef);

    if (!salonSnap.exists()) {
      return res.status(404).json({ error: "Salon not found" });
    }

    if (salonSnap.val().ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    /* 🆕 CREATE SERVICE */
    const serviceRef = push(
      ref(db, `salonandspa/salons/${salonId}/services`)
    );
    const serviceId = serviceRef.key;

    const serviceData = {
      serviceId,
      name: name.trim(),
      price,
      duration,
      category: category || "",
      description: description || "",
      isActive: true,
      createdAt: Date.now(),
    };

    /* 📸 IMAGE */
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const filePath = `salonandspa/services/${salonId}/${serviceId}-${Date.now()}.${ext}`;
      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      serviceData.image = await getDownloadURL(imgRef);
      serviceData.imagePath = filePath;
    } else {
      serviceData.image = "";
      serviceData.imagePath = "";
    }

    /* ✅ SAVE SERVICE */
    await update(serviceRef, serviceData);

    /* ================= ASSIGN EMPLOYEES ================= */
    let parsedAssignedEmployees = [];
    if (assignedEmployees) {
      try {
        parsedAssignedEmployees = Array.isArray(assignedEmployees)
          ? assignedEmployees
          : JSON.parse(assignedEmployees);
      } catch (e) {
        console.error("PARSE EMPLOYEES ERROR:", e.message);
        parsedAssignedEmployees = [];
      }
    }

    if (parsedAssignedEmployees.length > 0) {
      for (const employeeId of parsedAssignedEmployees) {
        const empRef = ref(db, `salonandspa/employees/${employeeId}`);
        const empSnap = await get(empRef);

        if (!empSnap.exists()) continue;

        const empData = empSnap.val();

        if (empData.isActive === false) continue;

        await runTransaction(empRef, (emp) => {
          if (!emp) return emp;

          emp.services = emp.services || {};

          if (!emp.services[serviceId]) {
            emp.services[serviceId] = {
              serviceId,
              name: serviceData.name,
              type: "salon",
              placeId: salonId,
              isActive: true,
              linkedAt: Date.now(),
            };
          } else {
            // Reactivate if it was soft-unassigned
            emp.services[serviceId].isActive = true;
            emp.services[serviceId].updatedAt = Date.now();
          }

          // Ensure salon indexed
          const prefix = "salonid";
          const alreadyLinked = Object.keys(emp).some(
            (k) => k.startsWith(prefix) && emp[k] === salonId
          );

          if (!alreadyLinked) {
            let maxIndex = 0;
            Object.keys(emp).forEach((k) => {
              if (k.startsWith(prefix)) {
                const n = parseInt(k.replace(prefix, ""));
                if (!isNaN(n)) maxIndex = Math.max(maxIndex, n);
              }
            });
            emp[`${prefix}${maxIndex + 1}`] = salonId;
          }

          emp.updatedAt = Date.now();
          return emp;
        });

        // Index employee under salon
        const empInSalonRef = ref(
          db,
          `salonandspa/salons/${salonId}/employees/${employeeId}`
        );

        const empInSalonSnap = await get(empInSalonRef);
        if (!empInSalonSnap.exists()) {
          await set(empInSalonRef, {
            employeeId,
            isActive: true,
            linkedAt: Date.now(),
          });
        }
      }
    }

    return res.status(201).json({
      message: "Service created & employees assigned",
      serviceId,
      assignedEmployees: parsedAssignedEmployees,
    });
  } catch (err) {
    console.error("ADD SERVICE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


export const getSalonServices = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { salonId } = req.params;

    const salonRef = ref(db, `salonandspa/salons/${salonId}`);
    const salonSnap = await get(salonRef);

    if (!salonSnap.exists()) {
      return res.status(404).json({ error: "Salon not found" });
    }

    if (salonSnap.val().ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const servicesRef = ref(db, `salonandspa/salons/${salonId}/services`);
    const servicesSnap = await get(servicesRef);

    if (!servicesSnap.exists()) {
      return res.json({
        salonId,
        services: [],
      });
    }

    const services = Object.values(servicesSnap.val());

    return res.json({
      salonId,
      totalServices: services.length,
      services,
    });
  } catch (err) {
    console.error("GET SERVICES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateSalonService = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { salonId, serviceId } = req.params;

    const salonRef = ref(db, `salonandspa/salons/${salonId}`);
    const salonSnap = await get(salonRef);

    if (!salonSnap.exists())
      return res.status(404).json({ error: "Salon not found" });

    if (salonSnap.val().ownerId !== adminId)
      return res.status(403).json({ error: "Unauthorized" });

    const serviceRef = ref(
      db,
      `salonandspa/salons/${salonId}/services/${serviceId}`,
    );
    const serviceSnap = await get(serviceRef);

    if (!serviceSnap.exists())
      return res.status(404).json({ error: "Service not found" });

    const updateData = { ...req.body, updatedAt: Date.now() };
    const assignedEmployees = updateData.assignedEmployees;
    delete updateData.assignedEmployees;

    // 🔥 If new image uploaded → send to Firebase
    if (req.file) {
      const oldImagePath = serviceSnap.val().imagePath;

      // delete old image (optional but clean)
      if (oldImagePath) {
        try {
          await deleteObject(storageRef(storage, oldImagePath));
        } catch (e) {
          console.log("Old image delete skipped:", e.message);
        }
      }

      const ext = req.file.originalname.split(".").pop();
      const filePath = `salonandspa/services/${salonId}/${serviceId}-${Date.now()}.${ext}`;

      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(imgRef);

      updateData.image = downloadURL;
      updateData.imagePath = filePath;
    }

    await update(serviceRef, updateData);

    /* ================= SYNC EMPLOYEES ================= */
    let parsedAssignedEmployees = [];
    if (assignedEmployees) {
      try {
        parsedAssignedEmployees = Array.isArray(assignedEmployees)
          ? assignedEmployees
          : JSON.parse(assignedEmployees);
      } catch (e) {
        console.error("PARSE EMPLOYEES ERROR (UPDATE):", e.message);
        parsedAssignedEmployees = [];
      }
    }

    // Get all salon employees to sync assignments
    const salonEmployeesRef = ref(db, `salonandspa/salons/${salonId}/employees`);
    const salonEmpsSnap = await get(salonEmployeesRef);

    if (salonEmpsSnap.exists()) {
      const salonEmpIds = Object.keys(salonEmpsSnap.val());
      const serviceName = updateData.name || serviceSnap.val().name;

      for (const employeeId of salonEmpIds) {
        const isCurrentlySelected = parsedAssignedEmployees.includes(employeeId);
        const empRef = ref(db, `salonandspa/employees/${employeeId}`);

        await runTransaction(empRef, (emp) => {
          if (!emp) return emp;
          emp.services = emp.services || {};

          if (isCurrentlySelected) {
            // ✅ ADD OR REACTIVATE
            if (!emp.services[serviceId]) {
              emp.services[serviceId] = {
                serviceId,
                name: serviceName,
                type: "salon",
                placeId: salonId,
                isActive: true,
                linkedAt: Date.now(),
              };
            } else {
              emp.services[serviceId].isActive = true;
              emp.services[serviceId].name = serviceName; // Sync name update if any
              emp.services[serviceId].updatedAt = Date.now();
            }
          } else {
            // ❌ SOFT-UNASSIGN (if existed before)
            if (emp.services[serviceId]) {
              emp.services[serviceId].isActive = false;
              emp.services[serviceId].updatedAt = Date.now();
            }
          }

          emp.updatedAt = Date.now();
          return emp;
        });
      }
    }

    res.json({
      message: "Service updated & employees synced",
      updatedImage: updateData.image || null,
      assignedEmployees: parsedAssignedEmployees,
    });
  } catch (err) {
    console.error("UPDATE SERVICE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* Toggle Salon Service Active/Inactive */
export const toggleSalonService = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { salonId, serviceId } = req.params;

    const salonRef = ref(db, `salonandspa/salons/${salonId}`);
    const salonSnap = await get(salonRef);

    if (!salonSnap.exists()) {
      return res.status(404).json({ error: "Salon not found" });
    }

    if (salonSnap.val().ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const serviceRef = ref(
      db,
      `salonandspa/salons/${salonId}/services/${serviceId}`,
    );
    const serviceSnap = await get(serviceRef);

    if (!serviceSnap.exists()) {
      return res.status(404).json({ error: "Service not found" });
    }

    const currentStatus = serviceSnap.val().isActive === true;

    await update(serviceRef, {
      isActive: !currentStatus,
      updatedAt: Date.now(),
    });

    return res.json({
      message: `Service ${currentStatus ? "deactivated" : "activated"
        } successfully`,
      serviceId,
      isActive: !currentStatus,
    });
  } catch (err) {
    console.error("TOGGLE SERVICE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const assignEmployeeToSalonAndAddServices = async (req, res) => {
  try {
    const { employeeId, salonId, spaId, serviceIds, type } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!employeeId || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({
        error: "employeeId and serviceIds[] are required",
      });
    }

    if (type !== "salon" && type !== "spa") {
      return res.status(400).json({
        error: "type must be salon or spa",
      });
    }

    const placeId = type === "salon" ? salonId : spaId;
    if (!placeId) {
      return res.status(400).json({
        error: `${type}Id is required`,
      });
    }

    /* ✅ EXPLICIT COLLECTION */
    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    /* ---------------- EMPLOYEE ---------------- */
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const empData = empSnap.val();

    /* ---------------- SERVICES (FROM CORRECT COLLECTION) ---------------- */
    const servicesRef = ref(db, `${basePath}/${placeId}/services`);

    const servicesSnap = await get(servicesRef);
    if (!servicesSnap.exists()) {
      return res.status(404).json({ error: "No services found" });
    }

    const services = servicesSnap.val();
    const existingServices = empData.services || {};
    const servicesToAdd = {};

    for (const sid of serviceIds) {
      const svc = services[sid];
      if (!svc) continue;
      if (svc.isActive === false) continue;
      if (existingServices[sid]) continue;

      servicesToAdd[sid] = {
        serviceId: sid,
        name: svc.name?.trim() || "",
        type, // salon | spa
        placeId,
        isActive: true,
        linkedAt: Date.now(),
      };
    }

    if (Object.keys(servicesToAdd).length === 0) {
      return res.status(409).json({
        error: "All services already added or inactive",
      });
    }

    /* ---------------- TRANSACTION (EMPLOYEE ONLY) ---------------- */
    await runTransaction(empRef, (emp) => {
      if (!emp) return emp;

      emp.services = emp.services || {};
      emp.isActive = true;
      emp.updatedAt = Date.now();

      // ✅ ADD SERVICES
      Object.entries(servicesToAdd).forEach(([sid, svc]) => {
        emp.services[sid] = svc;
      });

      // ✅ ADD salonidX / spaidX
      const prefix = type === "salon" ? "salonid" : "spaid";

      const alreadyExists = Object.keys(emp).some(
        (k) => k.startsWith(prefix) && emp[k] === placeId,
      );

      if (!alreadyExists) {
        let maxIndex = 0;

        Object.keys(emp).forEach((k) => {
          if (k.startsWith(prefix)) {
            const n = parseInt(k.replace(prefix, ""));
            if (!isNaN(n)) maxIndex = Math.max(maxIndex, n);
          }
        });

        emp[`${prefix}${maxIndex + 1}`] = placeId;
      }

      return emp;
    });

    /* ---------------- INDEX EMPLOYEE UNDER SALON / SPA ---------------- */
    const empInPlaceRef = ref(
      db,
      `${basePath}/${placeId}/employees/${employeeId}`,
    );

    const empInPlaceSnap = await get(empInPlaceRef);
    if (!empInPlaceSnap.exists()) {
      await set(empInPlaceRef, {
        employeeId,
        isActive: true,
        linkedAt: Date.now(),
      });
    }

    return res.status(200).json({
      message: `${type.toUpperCase()} services linked successfully`,
      employeeId,
      placeId,
      servicesAdded: Object.keys(servicesToAdd),
    });
  } catch (err) {
    console.error("ASSIGN EMPLOYEE ERROR:", err);
    return res.status(500).json({
      error: "Failed to assign services",
    });
  }
};

export const getAppointmentsByPlace = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "type must be salon or spa" });
    }

    if (!placeId) {
      return res.status(400).json({ error: "placeId is required" });
    }

    /* ---------------- PLACE (SALON / SPA) ---------------- */
    const basePath = type === "salon" ? "salons" : "spas";

    const placeSnap = await get(ref(db, `salonandspa/${basePath}/${placeId}`));

    if (!placeSnap.exists()) {
      return res.status(404).json({
        error: `${type} not found`,
      });
    }

    const placeData = placeSnap.val();
    const placeName = placeData.name || "";

    /* ---------------- APPOINTMENTS ---------------- */
    const apptRef = ref(db, `salonandspa/appointments/${type}/${placeId}`);

    const apptSnap = await get(apptRef);

    if (!apptSnap.exists()) {
      return res.json({
        type,
        placeId,
        placeName,
        totalAppointments: 0,
        appointments: [],
      });
    }

    const appointments = apptSnap.val();
    const result = [];

    // 1. Collect all unique IDs
    const customerIds = new Set();
    const employeeIds = new Set();
    const serviceIds = new Set();

    Object.values(appointments).forEach(appt => {
      if (appt.customerId) customerIds.add(appt.customerId);
      if (appt.employeeId) employeeIds.add(appt.employeeId);
      if (appt.services) {
        appt.services.forEach(s => serviceIds.add(s.serviceId));
      }
    });

    // 2. Fetch all dependencies in parallel
    const [customers, employees, services] = await Promise.all([
      Promise.all([...customerIds].map(async id => {
        const snap = await get(ref(db, `salonandspa/customer/${id}`));
        return { id, data: snap.exists() ? snap.val() : {} };
      })),
      Promise.all([...employeeIds].map(async id => {
        const snap = await get(ref(db, `salonandspa/employees/${id}`));
        return { id, data: snap.exists() ? snap.val() : {} };
      })),
      Promise.all([...serviceIds].map(async id => {
        const snap = await get(ref(db, `salonandspa/${basePath}/${placeId}/services/${id}`));
        return { id, data: snap.exists() ? snap.val() : {} };
      }))
    ]);

    // 3. Create Lookup Maps
    const customerMap = Object.fromEntries(customers.map(c => [c.id, c.data]));
    const employeeMap = Object.fromEntries(employees.map(e => [e.id, e.data]));
    const serviceMap = Object.fromEntries(services.map(s => [s.id, s.data]));

    // 4. Assemble Data
    for (const [appointmentId, appt] of Object.entries(appointments)) {
      const customer = customerMap[appt.customerId] || {};
      const employee = employeeMap[appt.employeeId] || {};

      const enrichedServices = (appt.services || []).map(svc => {
        const serviceData = serviceMap[svc.serviceId] || {};
        return {
          serviceId: svc.serviceId,
          name: serviceData.name || "",
          category: serviceData.category || "",
          image: serviceData.image || "",
          basePrice: Number(serviceData.price) || 0,
          baseDuration: serviceData.duration || "",
          isActive: serviceData.isActive ?? false,
        };
      });

      result.push({
        appointmentId,
        type,
        placeId,
        placeName,
        date: appt.date,
        startTime: appt.startTime,
        status: appt.status,
        paymentId: appt.paymentId,
        paymentStatus: appt.paymentStatus,
        totalAmount: appt.totalAmount,
        totalDuration: appt.totalDuration,
        customer: {
          customerId: appt.customerId,
          name: customer.name || appt.customer?.name || "",
          phone: customer.phone || appt.customer?.phone || "",
          email: customer.email || appt.customer?.email || "",
        },
        employee: {
          employeeId: appt.employeeId,
          name: employee.name || "",
          phone: employee.phone || "",
          image: employee.image || "",
        },
        services: enrichedServices,
        createdAt: appt.createdAt,
      });
    }

    /* ---------------- SORT ---------------- */
    result.sort(
      (a, b) =>
        new Date(`${a.date} ${a.startTime}`) -
        new Date(`${b.date} ${b.startTime}`),
    );

    return res.status(200).json({
      type,
      placeId,
      placeName,
      totalAppointments: result.length,
      appointments: result,
    });
  } catch (err) {
    console.error("GET APPOINTMENTS ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch appointments",
    });
  }
};

export const viewEmployees = async (req, res) => {
  try {
    const adminId = req.user.uid;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const empSnap = await get(ref(db, "salonandspa/employees"));

    if (!empSnap.exists()) {
      return res.json({ totalEmployees: 0, employees: [] });
    }

    const employees = Object.values(empSnap.val()).filter(
      (emp) => emp.ownerId === adminId,
    );

    const result = [];

    for (const emp of employees) {
      const enrichedServices = [];

      if (emp.services) {
        for (const svc of Object.values(emp.services)) {
          const { serviceId, type, placeId } = svc;
          if (!serviceId || !type || !placeId) continue;

          const basePath =
            type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

          /* 🔹 Fetch service */
          const serviceSnap = await get(
            ref(db, `${basePath}/${placeId}/services/${serviceId}`),
          );

          /* 🔹 Fetch salon / spa */
          const placeSnap = await get(ref(db, `${basePath}/${placeId}`));

          if (serviceSnap.exists()) {
            const serviceData = serviceSnap.val();

            enrichedServices.push({
              serviceId,
              name: serviceData.name || "",
              image: serviceData.image || "",
              price: Number(serviceData.price) || 0,
              duration: serviceData.duration || 0,
              category: serviceData.category || "",
              gender: serviceData.gender || "Unisex",
              isActive: serviceData.isActive !== false,

              type,
              placeId,
              placeName: placeSnap.exists() ? placeSnap.val().name || "" : "",
            });
          }
        }
      }

      result.push({
        employeeId: emp.empid || "",
        name: emp.name || "",
        phone: emp.phone || "",
        email: emp.email || "",
        image: emp.image || "",
        salary: emp.salary || 0,
        role: emp.role || "",
        joiningDate: emp.joiningDate || (emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : null),
        createdAt: emp.createdAt || "",
        isActive: emp.isActive === true,
        services: enrichedServices,
      });
    }

    return res.json({
      totalEmployees: result.length,
      employees: result,
    });
  } catch (err) {
    console.error("VIEW EMPLOYEES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const salonDashboardCounts = async (req, res) => {
  try {
    const { salonId: placeId } = req.params;
    const ownerId = req.user.uid; // from JWT

    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }

    /* ---------------- VERIFY OWNERSHIP (SALON OR SPA) ---------------- */
    let placeSnap = await get(ref(db, `salonandspa/salons/${placeId}`));
    let type = "salon";

    if (!placeSnap.exists()) {
      placeSnap = await get(ref(db, `salonandspa/spas/${placeId}`));
      type = "spa";
    }

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: "Place not found" });
    }

    const place = placeSnap.val();

    if (String(place.ownerId) !== String(ownerId)) {
      return res.status(403).json({
        error: "You are not authorized to access this place",
      });
    }

    /* ---------------- FETCH APPOINTMENTS ---------------- */
    const apptSnap = await get(
      ref(db, `salonandspa/appointments/${type}/${placeId}`),
    );

    let todayCount = 0;
    let weekCount = 0;
    const customerSet = new Set();

    if (apptSnap.exists()) {
      const appointments = apptSnap.val();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Sunday start

      Object.values(appointments).forEach((appt) => {
        if (!appt.date) return;

        // Try to handle YYYY-MM-DD or other formats
        const apptDate = new Date(appt.date);
        apptDate.setHours(0, 0, 0, 0);

        if (isNaN(apptDate.getTime())) return;

        // unique customers
        if (appt.customerId) {
          customerSet.add(appt.customerId);
        }

        // today count
        if (apptDate.getTime() === today.getTime()) {
          todayCount++;
        }

        // week count
        if (apptDate >= weekStart && apptDate <= today) {
          weekCount++;
        }
      });
    }

    /* ---------------- RESPONSE ---------------- */
    return res.status(200).json({
      placeId,
      type,
      totalCustomers: customerSet.size,
      todayAppointments: todayCount,
      thisWeekAppointments: weekCount,
    });
  } catch (error) {
    console.error("DASHBOARD COUNT ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get ALL customers of a salon or spa
 * - Includes WALK-IN + ONLINE
 * - UNIQUE by phone number
 * - Owner protected
 * - mode: "walkin" | "online"
 *
 * GET /api/customers/:type/:placeId/all


/**
 * Get ALL customers of a salon or spa
 * - Unique by phone
 * - Walk-in + Online
 * - Visit count
 * - Last visit date
 * - Owner protected
 *
 * GET /api/customers/:type/:placeId/all
 */
export const getCustomerVisitAnalytics = async (req, res) => {
  try {
    const { type, placeId } = req.params;
    const ownerId = req.user.uid;

    /* ---------------- VALIDATION ---------------- */
    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    /* ---------------- VERIFY OWNERSHIP ---------------- */
    const placeSnap = await get(ref(db, `salonandspa/${type}s/${placeId}`));

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    if (String(placeSnap.val().ownerId) !== String(ownerId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    /* ---------------- FETCH APPOINTMENTS ---------------- */
    const apptSnap = await get(
      ref(db, `salonandspa/appointments/${type}/${placeId}`),
    );

    if (!apptSnap.exists()) {
      return res.status(200).json({
        placeId,
        type,
        totalCustomers: 0,
        totalVisits: 0,
        totalWalkinVisits: 0,
        totalOnlineVisits: 0,
        customers: [],
      });
    }

    const appointments = apptSnap.val();

    /* ---------------- FETCH REGISTERED CUSTOMERS & LOYALTY ---------------- */
    const [customerSnap, loyaltySnap] = await Promise.all([
      get(ref(db, "salonandspa/customer")),
      get(ref(db, "salonandspa/loyalty"))
    ]);

    const registeredCustomers = customerSnap.exists() ? customerSnap.val() : {};
    const allLoyalty = loyaltySnap.exists() ? loyaltySnap.val() : {};

    /* ---------------- AGGREGATION ---------------- */
    const customerMap = new Map();
    let totalWalkinVisits = 0;
    let totalOnlineVisits = 0;

    Object.values(appointments).forEach((appt) => {
      let phone = null;
      let name = "";
      let email = "";
      let mode = "online";

      /* ONLINE */
      if (appt.customerId && registeredCustomers[appt.customerId]) {
        const c = registeredCustomers[appt.customerId];
        phone = String(c.phone || "").trim();
        name = c.name || "";
        email = c.email || "";
        mode = "online";
      }

      /* WALK-IN (OVERRIDES) */
      const walkinPhone =
        appt.customer?.phone ||
        appt.walkin?.phone ||
        appt.customerPhone ||
        appt.phone ||
        null;

      if (walkinPhone) {
        phone = String(walkinPhone).trim();
        name =
          appt.customer?.name ||
          appt.walkin?.name ||
          appt.customerName ||
          appt.name ||
          name;
        email =
          appt.customer?.email ||
          appt.walkin?.email ||
          appt.customerEmail ||
          appt.email ||
          email;
        mode = "walkin";
      }

      if (!phone) return;

      const visitDate =
        appt.date ||
        (appt.createdAt
          ? new Date(appt.createdAt).toISOString().slice(0, 10)
          : null);

      /* GLOBAL COUNTS */
      if (mode === "walkin") totalWalkinVisits++;
      else totalOnlineVisits++;

      /* PER CUSTOMER */
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          phone,
          name,
          email,
          walkinVisits: mode === "walkin" ? 1 : 0,
          onlineVisits: mode === "online" ? 1 : 0,
          totalVisits: 1,
          lastVisitDate: visitDate,
          loyaltyPoints: allLoyalty[phone]?.points || 0,
        });
      } else {
        const c = customerMap.get(phone);
        c.totalVisits += 1;
        if (mode === "walkin") c.walkinVisits += 1;
        else c.onlineVisits += 1;

        if (
          visitDate &&
          (!c.lastVisitDate || new Date(visitDate) > new Date(c.lastVisitDate))
        ) {
          c.lastVisitDate = visitDate;
        }

        customerMap.set(phone, c);
      }
    });

    /* ---------------- RESPONSE ---------------- */
    return res.status(200).json({
      placeId,
      type,
      totalCustomers: customerMap.size,
      totalVisits: totalWalkinVisits + totalOnlineVisits,
      totalWalkinVisits,
      totalOnlineVisits,
      customers: Array.from(customerMap.values()),
    });
  } catch (error) {
    console.error("CUSTOMER ANALYTICS ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const PLAN_LIMITS = {
  basic: 1,
  standard: 2,
  premium: 5,
};

export const createBranch = async (req, res) => {
  try {
    const adminId = req.user.uid;

    const {
      type, // salon | spa
      name,
      branch,
      address,
      pincode,
      gstNumber,
      phone,
      description,
      latitude,
      longitude,
    } = req.body || {};

    /* ---------- VALIDATION ---------- */
    if (!type || !name || !branch || !address || !pincode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid business type" });
    }

    /* ---------- FETCH ADMIN ---------- */
    const adminRef = ref(db, `salonandspa/admin/${adminId}`);
    const adminSnap = await get(adminRef);

    if (!adminSnap.exists()) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const admin = adminSnap.val();
    const subscription = admin.subscription;
       console.log("Subscription:", subscription);
    /* ---------- SUBSCRIPTION CHECK ---------- */
    if (
      !subscription ||
      subscription.status !== "active" ||
      Date.now() > subscription.expiresAt
    ) {
      return res.status(403).json({
        error: "Subscription inactive or expired",
      });
    }

    /* ---------- PLAN LIMIT ---------- */
    // Use stored maxBusinesses or fallback to a safe 0 if something is wrong
    const maxBranches = Number(subscription.maxBusinesses) || 0;
    const currentCount = (admin.salonCount || 0) + (admin.spaCount || 0);
    console.log("Admin:", admin);
    console.log("Current count:", currentCount);
    console.log("Max branches:", maxBranches);
    if (currentCount >= maxBranches) {
      return res.status(403).json({
        error: `Your plan limit (${maxBranches} branches) is reached. Please upgrade to add more.`,
      });
    }

    // Additional check on remainingCount if it exists
    if (subscription.remainingCount !== undefined && subscription.remainingCount <= 0) {
      return res.status(403).json({
        error: "Your branch limit is exhausted.",
      });
    }

    /* ---------- DUPLICATE BRANCH ---------- */
    const allSnap = await get(ref(db, `salonandspa/${type}s`));
    if (allSnap.exists()) {
      const exists = Object.values(allSnap.val()).some(
        (b) =>
          b.ownerId === adminId &&
          b.branch?.toLowerCase() === branch.toLowerCase()
      );


      if (exists) {
        return res.status(409).json({
          error: `${type} already exists for this branch`,
        });
      }
    }

    /* ---------- IMAGE UPLOAD ---------- */
    let imageUrl = "";
    let imagePath = "";

    const newCount = currentCount + 1;
    const branchKey = `${type}id${newCount}`;

    if (req.file) {
      imagePath = `${type}s/${adminId}/${branchKey}_${Date.now()}`;
      const imgRef = storageRef(storage, imagePath);
      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });
      imageUrl = await getDownloadURL(imgRef);
    }

    /* ---------- CREATE BRANCH ---------- */
    const branchRef = push(ref(db, `salonandspa/${type}s`));
    const branchId = branchRef.key;

    const branchData = {
      [`${type}Id`]: branchId,
      [`${type}Key`]: branchKey,
      ownerId: adminId,
      type,
      name,
      branch,
      address,
      pincode,
      gstNumber: gstNumber || "",
      phone: phone || "",
      description: description || "",
      image: imageUrl,
      imagePath,
      latitude: latitude || 0,
      longitude: longitude || 0,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await set(branchRef, branchData);

    /* ---------- UPDATE ADMIN ---------- */
    const updatePayload = {
      [`${type}Count`]: (admin[`${type}Count`] || 0) + 1,
      updatedAt: Date.now(),
    };

    if (subscription.remainingCount !== undefined) {
      updatePayload["subscription/remainingCount"] = Math.max(0, subscription.remainingCount - 1);
    }

    await update(adminRef, updatePayload);

    return res.status(201).json({
      message: "Branch created successfully",
      branchId,
      remainingBranches: maxBranches - newCount,
    });
  } catch (err) {
    console.error("CREATE BRANCH ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.uid;

    const { name, phone, address, gstNumber, description } = req.body;

    /* ---------------- FETCH ADMIN ---------------- */
    const adminRef = ref(db, `salonandspa/admin/${adminId}`);
    const adminSnap = await get(adminRef);

    if (!adminSnap.exists()) {
      return res.status(404).json({ error: "Admin not found" });
    }

    let imageUrl = adminSnap.val().image || "";
    let imagePath = adminSnap.val().imagePath || "";

    /* ---------------- IMAGE UPLOAD ---------------- */
    if (req.file) {
      imagePath = `admin/${adminId}/profile_${Date.now()}`;
      const imgRef = storageRef(storage, imagePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      imageUrl = await getDownloadURL(imgRef);
    }

    /* ---------------- UPDATE DATA ---------------- */
    const updateData = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(gstNumber && { gstNumber }),
      ...(description && { description }),
      image: imageUrl,
      imagePath,
      updatedAt: Date.now(),
    };

    await update(adminRef, updateData);

    return res.status(200).json({
      message: "Admin profile updated successfully",
      data: updateData,
    });
  } catch (error) {
    console.error("UPDATE ADMIN PROFILE ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const addEmployeeAndAssignServices = async (req, res) => {
  try {
    const ownerId = req.user.uid;

    const {
      name,
      phone,
      role,
      email,
      gender,
      experience,
      salary,
      type, // "salon" | "spa"
      salonId,
      spaId,
      serviceIds,
    } = req.body;

    /* ---------- VALIDATION ---------- */

    if (!name || !phone || !role || !gender) {
      return res.status(400).json({
        error: "Name, phone, role and gender are required",
      });
    }

    if (!genders.includes(gender)) {
      return res.status(400).json({ error: "Invalid gender" });
    }

    if (!type || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({
        error: "type and serviceIds[] are required",
      });
    }

    if (type !== "salon" && type !== "spa") {
      return res.status(400).json({ error: "Invalid type" });
    }

    const placeId = type === "salon" ? salonId : spaId;
    if (!placeId) {
      return res.status(400).json({
        error: `${type}Id is required`,
      });
    }

    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    /* ---------- PHONE UNIQUE ---------- */

    const empRootRef = ref(db, "salonandspa/employees");
    const phoneQuery = query(empRootRef, orderByChild("phone"), equalTo(phone));
    const phoneSnap = await get(phoneQuery);

    if (phoneSnap.exists()) {
      return res.status(400).json({
        error: "Employee with this phone already exists",
      });
    }

    /* ---------- CREATE EMPLOYEE ---------- */

    const empRef = push(empRootRef);
    const employeeId = empRef.key;
    const now = Date.now();

    const employeeData = {
      empid: employeeId,
      name,
      phone,
      role,
      gender,
      email: email || "",
      experience: experience || "0",
      salary: salary || "0",
      ownerId,
      createdBy: ownerId,
      isActive: true,
      createdAt: now,
      services: {},
    };

    await set(empRef, employeeData);

    /* ---------- FETCH SERVICES ---------- */

    const servicesRef = ref(db, `${basePath}/${placeId}/services`);
    const servicesSnap = await get(servicesRef);

    if (!servicesSnap.exists()) {
      return res.status(404).json({ error: "No services found" });
    }

    const services = servicesSnap.val();
    const servicesToAdd = {};

    /* ---------- IMAGE (OPTIONAL) ---------- */

    let image = "";
    let imagePath = "";

    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      imagePath = `salonandspa/employee-services/${employeeId}/${now}.${ext}`;

      const imgRef = storageRef(storage, imagePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      image = await getDownloadURL(imgRef);
    }

    /* ---------- PREPARE SERVICES ---------- */

    for (const sid of serviceIds) {
      const svc = services[sid];
      if (!svc || svc.isActive === false) continue;

      servicesToAdd[sid] = {
        serviceId: sid,
        name: svc.name?.trim() || "",
        type,
        placeId,
        isActive: true,
        linkedAt: now,
        image,
        imagePath,
      };
    }

    if (Object.keys(servicesToAdd).length === 0) {
      return res.status(409).json({
        error: "All services inactive or invalid",
      });
    }

    /* ---------- TRANSACTION (EMPLOYEE) ---------- */

    await runTransaction(empRef, (emp) => {
      if (!emp) return emp;

      emp.services = emp.services || {};
      emp.updatedAt = now;

      Object.entries(servicesToAdd).forEach(([sid, svc]) => {
        emp.services[sid] = svc;
      });

      const prefix = type === "salon" ? "salonid" : "spaid";

      let maxIndex = 0;
      Object.keys(emp).forEach((k) => {
        if (k.startsWith(prefix)) {
          const n = parseInt(k.replace(prefix, ""));
          if (!isNaN(n)) maxIndex = Math.max(maxIndex, n);
        }
      });

      emp[`${prefix}${maxIndex + 1}`] = placeId;

      if (type === "salon") emp.salons = (emp.salons || 0) + 1;
      if (type === "spa") emp.spas = (emp.spas || 0) + 1;

      return emp;
    });

    /* ---------- INDEX UNDER SALON / SPA ---------- */

    await set(ref(db, `${basePath}/${placeId}/employees/${employeeId}`), {
      employeeId,
      isActive: true,
      linkedAt: now,
    });

    return res.status(201).json({
      message: "Employee created and services assigned (image optional)",
      employeeId,
      placeId,
      servicesAdded: Object.keys(servicesToAdd),
      imageUploaded: !!image,
    });
  } catch (err) {
    console.error("EMPLOYEE + SERVICE ERROR:", err);
    return res.status(500).json({
      error: "Failed to create and assign employee",
    });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { type, branchId } = req.params;

    const { name, branch, address, pincode, gstNumber, phone, email, website, description, latitude, longitude } =
      req.body || {};

    /* ---------------- VALIDATION ---------------- */
    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    if (!branchId) {
      return res.status(400).json({ error: "branchId required" });
    }

    /* ---------------- FETCH BRANCH ---------------- */
    const branchRef = ref(db, `salonandspa/${type}s/${branchId}`);
    const branchSnap = await get(branchRef);

    if (!branchSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    const branchData = branchSnap.val();

    /* ---------------- OWNER CHECK ---------------- */
    if (branchData.ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    /* ---------------- DUPLICATE BRANCH NAME CHECK ---------------- */
    if (branch) {
      const allSnap = await get(ref(db, `salonandspa/${type}s`));

      if (allSnap.exists()) {
        const exists = Object.values(allSnap.val()).some(
          (b) =>
            b.ownerId === adminId &&
            b.branch?.toLowerCase() === branch.toLowerCase() &&
            b[`${type}Id`] !== branchId,
        );

        if (exists) {
          return res.status(409).json({
            error: `${type} already exists for this branch`,
          });
        }
      }
    }

    /* ---------------- IMAGE UPDATE ---------------- */
    let imageUrl = branchData.image || "";
    let imagePath = branchData.imagePath || "";

    if (req.file) {
      // delete old image
      if (imagePath) {
        try {
          await deleteObject(storageRef(storage, imagePath));
        } catch (err) {
          console.warn("Old image delete failed:", err.message);
        }
      }

      imagePath = `${type}s/${adminId}/${branchData[`${type}Key`]}_${Date.now()}`;
      const imgRef = storageRef(storage, imagePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      imageUrl = await getDownloadURL(imgRef);
    }

    /* ---------------- UPDATE PAYLOAD ---------------- */
    const updateData = {
      ...(name && { name }),
      ...(branch && { branch }),
      ...(address && { address }),
      ...(pincode && { pincode }),
      ...(gstNumber !== undefined && { gstNumber }),
      ...(phone !== undefined && { phone }),
      ...(email && { email }),
      ...(website && { website }),
      ...(description !== undefined && { description }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      image: imageUrl,
      imagePath: imagePath,
      updatedAt: Date.now(),
    };

    await update(branchRef, updateData);

    return res.json({
      message: `${type.toUpperCase()} branch updated successfully`,
      branchId,
      imageUrl,
    });
  } catch (error) {
    console.error("UPDATE BRANCH ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};


import { getDatabase } from "firebase/database";

/**
 * GET Master Staff (Receptionists) by Salon
 * URL: /api/admin/salon/receptionists/:salonId
 */
export const getReceptionistsBySalon = async (req, res) => {
  try {
    const { salonId } = req.params;

    console.log("➡️ Fetch receptionists from employees for salon:", salonId);

    if (!salonId) {
      return res.status(400).json({ message: "salonId is required" });
    }

    const db = getDatabase();
    const employeesRef = ref(db, "employees");
    const snapshot = await get(employeesRef);

    if (!snapshot.exists()) {
      console.log("ℹ️ No employees found");
      return res.status(200).json([]);
    }

    const employees = snapshot.val();

    // 🔥 FILTER RECEPTIONIST (MASTER STAFF)
    const receptionists = Object.entries(employees)
      .filter(([_, emp]) => {
        return (
          emp.salonId === salonId &&
          emp.role === "Senior Stylist" &&
          emp.isActive === true
        );
      })
      .map(([id, emp]) => ({
        id,
        name: emp.name || "",
        email: emp.email || "",
        phone: emp.phone || "",
        status: emp.isActive ? "Active" : "Inactive",
        shift: emp.shift || "",
      }));

    console.log("✅ Receptionists resolved:", receptionists);

    return res.status(200).json(receptionists);
  } catch (error) {
    console.error("❌ getReceptionistsBySalon error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




export const createReceptionist = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { name, email, phone, shift, status, salonId } = req.body;

    console.log("➡️ CREATE RECEPTIONIST:", req.body);

    if (!salonId || !name || !phone) {
      return res.status(400).json({
        error: "salonId, name and phone are required",
      });
    }

    const db = getDatabase();
    const receptionistRef = ref(db, "salonandspa/receptionists");

    const newRef = push(receptionistRef);

    const data = {
      name,
      email: email || "",
      phone,
      shift: shift || "",
      status: status || "Off Duty",
      salonId,
      role: "receptionist",
      createdBy: adminId,
      createdAt: Date.now(),
    };

    await set(newRef, data);

    return res.status(201).json({
      id: newRef.key,
      ...data,
    });
  } catch (err) {
    console.error("❌ createReceptionist error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET Single Employee Details
 * URL: /api/admin/employee/:employeeId
 */
export const getEmployee = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ error: "employeeId is required" });
    }

    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = empSnap.val();

    // Verification: Ensure requester is the owner
    // Note: employees have an ownerId field.
    if (employee.ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized access to this employee" });
    }

    return res.json({
      success: true,
      employee: {
        id: employeeId,
        ...employee,
        // Ensure services is an object even if empty in DB
        services: employee.services || {},
      },
    });
  } catch (err) {
    console.error("GET EMPLOYEE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * UPDATE Employee Services (Assign/Remove) & Link to Salon/Spa
 * URL: /api/admin/employee/:employeeId/services
 */
export const updateEmployeeServices = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { employeeId } = req.params;
    const { serviceIds, type, placeId } = req.body; // serviceIds is array of selected IDs

    if (!employeeId || !type || !placeId || !Array.isArray(serviceIds)) {
      return res.status(400).json({
        error: "employeeId, type, placeId, and serviceIds (array) are required",
      });
    }

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be salon or spa" });
    }

    const basePath = type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    // 1️⃣ Verify Place Ownership & Existence
    const placeRef = ref(db, `${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    if (placeSnap.val().ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized access to this business" });
    }

    // 2️⃣ Fetch Master Services for this Place
    const servicesRef = ref(db, `${basePath}/${placeId}/services`);
    const servicesSnap = await get(servicesRef);
    const placeServices = servicesSnap.exists() ? servicesSnap.val() : {};

    // 3️⃣ Fetch Employee
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const empData = empSnap.val();
    if (empData.ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized access to this employee" });
    }

    // 4️⃣ Execute Transaction to Update Employee
    await runTransaction(empRef, (emp) => {
      if (!emp) return emp;

      emp.services = emp.services || {};
      emp.updatedAt = Date.now();

      // --- A. Sync Services ---
      // We only touch services that belong to THIS placeId.
      // Other services are preserved.

      // Step A1: Remove unchecked services (that belong to this place)
      Object.keys(emp.services).forEach((key) => {
        const svc = emp.services[key];
        if (svc.placeId === placeId) {
          if (!serviceIds.includes(key)) {
            delete emp.services[key]; // Remove if not in the new selected list
          }
        }
      });

      // Step A2: Add new selected services
      serviceIds.forEach((sid) => {
        // Only if it's a valid service from the master list
        if (placeServices[sid]) {
          // If already exists, we leave it (or could update details if needed)
          if (!emp.services[sid]) {
            emp.services[sid] = {
              serviceId: sid,
              name: placeServices[sid].name?.trim() || "",
              type,
              placeId,
              isActive: true,
              linkedAt: Date.now(),
              // We don't have custom image logic here yet, but could add if passed
            };
          }
        }
      });

      // --- B. Ensure Linked to Place (Link & Update) ---
      const prefix = type === "salon" ? "salonid" : "spaid";
      const isLinked = Object.keys(emp).some(
        (k) => k.startsWith(prefix) && emp[k] === placeId
      );

      if (!isLinked) {
        let maxIndex = 0;
        Object.keys(emp).forEach((k) => {
          if (k.startsWith(prefix)) {
            const n = parseInt(k.replace(prefix, ""));
            if (!isNaN(n)) maxIndex = Math.max(maxIndex, n);
          }
        });
        emp[`${prefix}${maxIndex + 1}`] = placeId;

        // Update counts
        if (type === "salon") emp.salons = (emp.salons || 0) + 1;
        if (type === "spa") emp.spas = (emp.spas || 0) + 1;
      }

      return emp;
    });

    // 5️⃣ Ensure Index in Place (Idempotent)
    const empInPlaceRef = ref(db, `${basePath}/${placeId}/employees/${employeeId}`);
    // We can blindly set this or check first. Setting is safer to ensure consistency.
    await update(empInPlaceRef, {
      employeeId,
      isActive: true, // Assuming active if being assigned services
      linkedAt: empData.assignments?.[placeId]?.linkedAt || Date.now(), // Preserve or new
    });

    return res.json({
      success: true,
      message: "Employee services updated and linked successfully",
    });

  } catch (err) {
    console.error("UPDATE EMPLOYEE SERVICES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
export const getAllPlaces = async (req, res) => {
  try {
    const uid = req.user.uid;
    const role = req.user.role;

    const salonsRef = ref(db, "salonandspa/salons");
    const spasRef = ref(db, "salonandspa/spas");

    const [salonsSnap, spasSnap, empSnap] = await Promise.all([
      get(salonsRef),
      get(spasRef),
      get(ref(db, `salonandspa/employees/${uid}`)) // only used if NOT admin
    ]);

    const branches = [];

    /* ===================================================
       ✅ ADMIN / SUPERADMIN → OWNED PLACES
    =================================================== */

    if (role === "admin" || role === "superadmin") {

      if (salonsSnap.exists()) {
        Object.entries(salonsSnap.val()).forEach(([id, salon]) => {
          if (salon.ownerId === uid) {
            branches.push({
              id, // 🔥 ALWAYS use key
              name: salon.name || "",
              branch: salon.branch || "",
              location: salon.address || "",
              image: salon.image || "",
              phone: salon.phone || "",
              description: salon.description || "",
              active: salon.status === "active",
              latitude: salon.latitude || 0,
              longitude: salon.longitude || 0,
              type: "salon",
              createdAt: salon.createdAt || null
            });
          }
        });
      }

      if (spasSnap.exists()) {
        Object.entries(spasSnap.val()).forEach(([id, spa]) => {
          if (spa.ownerId === uid) {
            branches.push({
              id,
              name: spa.name || "",
              branch: spa.branch || "",
              location: spa.address || "",
              image: spa.image || "",
              phone: spa.phone || "",
              description: spa.description || "",
              active: spa.status === "active",
              latitude: spa.latitude || 0,
              longitude: spa.longitude || 0,
              type: "spa",
              createdAt: spa.createdAt || null
            });
          }
        });
      }
    }

    /* ===================================================
       ✅ STAFF / RECEPTIONIST → LINKED PLACES
    =================================================== */

    else {

      if (!empSnap.exists()) {
        return res.json({
          count: 0,
          branches: []
        });
      }

      const emp = empSnap.val();

      const salonIds = Object.keys(emp)
        .filter(k => k.startsWith("salonid"))
        .map(k => emp[k]);

      const spaIds = Object.keys(emp)
        .filter(k => k.startsWith("spaid"))
        .map(k => emp[k]);

      // 🔥 fetch only needed places
      for (const id of salonIds) {

        const salon = salonsSnap.val()?.[id];
        if (!salon) continue;

        branches.push({
          id,
          name: salon.name || "",
          branch: salon.branch || "",
          location: salon.address || "",
          image: salon.image || "",
          type: "salon",
        });
      }

      for (const id of spaIds) {

        const spa = spasSnap.val()?.[id];
        if (!spa) continue;

        branches.push({
          id,
          name: spa.name || "",
          branch: spa.branch || "",
          location: spa.address || "",
          image: spa.image || "",
          type: "spa",
        });
      }
    }

    /* ===================================================
       ✅ SORT (Newest First — optional but pro)
    =================================================== */

    branches.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return res.json({
      count: branches.length,
      branches
    });

  } catch (err) {
    console.error("GET ALL PLACES ERROR:", err);

    return res.status(500).json({
      error: "Failed to load places"
    });
  }
};

export const getPopularServices = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    /* ---------------- VALIDATION ---------------- */

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({
        error: "type must be salon or spa",
      });
    }

    if (!placeId) {
      return res.status(400).json({
        error: "placeId is required",
      });
    }

    const basePath = type === "salon" ? "salons" : "spas";

    /* ---------------- FILTER RANGE ---------------- */
    const now = new Date();
    const filterMonth = req.query.month ? Number(req.query.month) - 1 : now.getMonth();
    const filterYear = req.query.year ? Number(req.query.year) : now.getFullYear();

    const startOfMonth = new Date(
      filterYear,
      filterMonth,
      1
    ).getTime();

    const endOfMonth = new Date(
      filterYear,
      filterMonth + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();


    /* ---------------- FETCH APPOINTMENTS ---------------- */

    const apptRef = ref(
      db,
      `salonandspa/appointments/${type}/${placeId}`
    );

    const snap = await get(apptRef);

    if (!snap.exists()) {
      return res.json([]);
    }

    const appointments = Object.values(snap.val());

    /* ---------------- COUNT SERVICES ---------------- */

    const serviceCounts = {};
    let totalProcessed = 0;
    let dateFiltered = 0;
    let futureFiltered = 0;
    let statusFiltered = 0;
    let validAppointments = 0;

    // Log first few appointment dates for debugging

    appointments.slice(0, 3).forEach((appt, idx) => {
      if (appt) {
      }
    });

    for (const appt of appointments) {
      if (!appt) continue;
      if (!appt.date) continue;
      totalProcessed++;

      /* ---------- SAFE DATE PARSING ---------- */
      let dateObj;
      const rawDate = appt.date;

      if (!rawDate) {
        continue;
      }

      if (typeof rawDate === "number") {
        dateObj = new Date(rawDate);
      } else if (typeof rawDate === "string") {
        if (rawDate.includes("-") && rawDate.split("-")[0].length === 2) {
          const [d, m, y] = rawDate.split("-");

          dateObj = new Date(
            Number(y),
            Number(m) - 1,
            Number(d)
          );
        }
        else {
          dateObj = new Date(rawDate);
        }
      } else {
        continue;
      }

      if (isNaN(dateObj.getTime())) {
        continue;
      }

      const time = dateObj.getTime();

      // Log first few dates being compared
      if (totalProcessed <= 3) {
      }

      /* ---------- FILTER RANGE ---------- */
      if (time < startOfMonth || time > endOfMonth) {
        dateFiltered++;
        continue;
      }

      // REMOVED FUTURE CHECK: We want to see booked services for future months too
      // if (time > Date.now()) {
      //   futureFiltered++;
      //   continue;
      // }

      /* ---------- ONLY PAID + ACTIVE ---------- */
      const status = (appt.status || "").toLowerCase();
      const paymentStatus = (appt.paymentStatus || "").toLowerCase();

      if (
        paymentStatus !== "paid" ||
        (status !== "booked" && status !== "confirmed")
      ) {
        statusFiltered++;
        continue;
      }

      validAppointments++;

      /* ---------- COUNT SERVICES & BLOCKS ---------- */
      const services = Array.isArray(appt.services)
        ? appt.services
        : Array.isArray(appt.blocks)
          ? appt.blocks
          : [];

      if (services.length === 0) {
      }

      for (const svc of services) {
        const id = svc.serviceId || svc.id || svc.name;
        if (!id) continue;

        serviceCounts[id] = (serviceCounts[id] || 0) + 1;
      }
    }



    /* ---------------- FETCH SERVICES ONCE ---------------- */

    const servicesSnap = await get(
      ref(db, `salonandspa/${basePath}/${placeId}/services`)
    );

    const servicesDB = servicesSnap.exists()
      ? servicesSnap.val()
      : {};

    /* ---------------- MAP RESULT ---------------- */

    const popularServices = Object.entries(serviceCounts)
      .map(([serviceId, count]) => ({
        serviceId,
        name:
          servicesDB?.[serviceId]?.name ||
          "Deleted Service",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    return res.json(popularServices);

  } catch (err) {

    return res.status(500).json({
      error: "Failed to fetch popular services",
    });
  }
};



export const updateTimings = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { placeId, type } = req.params;
    const { timings } = req.body;

    if (!placeId || !type || !timings) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const basePath = type === "salon" ? "salonandspa/salons" : "salonandspa/spas";
    const placeRef = ref(db, `${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: "Place not found" });
    }

    if (placeSnap.val().ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Standardize days
    const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const currentTimings = placeSnap.val().timings || {};
    const updatedTimings = { ...currentTimings };

    Object.keys(timings).forEach((day) => {
      const lowerDay = day.toLowerCase();
      if (DAYS.includes(lowerDay)) {
        updatedTimings[lowerDay] = {
          isOpen: timings[day].isOpen ?? (currentTimings[lowerDay]?.isOpen || false),
          open: timings[day].open || currentTimings[lowerDay]?.open || "",
          close: timings[day].close || currentTimings[lowerDay]?.close || ""
        };
      }
    });

    await update(placeRef, { timings: updatedTimings, updatedAt: Date.now() });

    return res.json({ message: "Timings updated successfully", timings: updatedTimings });
  } catch (err) {
    console.error("UPDATE TIMINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* =====================================================
   ROLES MANAGEMENT (PERMISSION ROLES)
   ===================================================== */

export const saveRole = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const userRole = req.user.role;

    if (!["admin", "superadmin"].includes(userRole)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { roleId, name, description, permissions } = req.body;

    if (!roleId || !name || typeof permissions !== "object") {
      return res.status(400).json({
        error: "roleId, name and permissions are required",
      });
    }

    const roleRef = ref(db, `salonandspa/roles/${roleId}`);
    const snap = await get(roleRef);

    const payload = {
      roleId,
      name: name.trim(),
      description: description || "",
      permissions,
      updatedAt: Date.now(),
      updatedBy: adminId,
    };

    if (!snap.exists()) {
      payload.createdAt = Date.now();
      payload.createdBy = adminId;
      await set(roleRef, payload);
    } else {
      await update(roleRef, payload);
    }

    return res.json({
      success: true,
      message: "Role saved successfully",
    });
  } catch (err) {
    console.error("SAVE ROLE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getRoles = async (req, res) => {
  try {
    const snap = await get(ref(db, "salonandspa/roles"));

    if (!snap.exists()) {
      return res.json([]);
    }

    return res.json(Object.values(snap.val()));
  } catch (err) {
    console.error("GET ROLES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;

    const snap = await get(ref(db, `salonandspa/roles/${roleId}`));

    if (!snap.exists()) {
      return res.status(404).json({ error: "Role not found" });
    }

    return res.json(snap.val());
  } catch (err) {
    console.error("GET ROLE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * INIT PERMISSIONS FOR SALON / SPA (ON DEMAND)
 * URL: POST /api/admin/place/:type/:placeId/permissions/init
 */
export const initPlacePermissions = async (req, res) => {
  try {
    const { type, placeId } = req.params; // type = salons | spas
    const adminId = req.user.uid;

    if (!["salons", "spas"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    // 1️⃣ Global roles
    const rolesSnap = await get(ref(db, "salonandspa/roles"));
    if (!rolesSnap.exists()) {
      return res.status(404).json({ error: "Global roles not found" });
    }

    const roles = rolesSnap.val();

    const { roleId: targetRoleId } = req.body;

    // 2️⃣ Existing permissions
    const permRef = ref(
      db,
      `salonandspa/${type}/${placeId}/permissions`
    );
    const permSnap = await get(permRef);
    const existingData = permSnap.val() || {};

    // 3️⃣ Logic: Initialize specific role OR All roles
    const payload = { ...existingData };

    const resetPermissions = (permsObj) => {
      const reset = {};
      Object.keys(permsObj).forEach((key) => {
        if (typeof permsObj[key] === "object") {
          reset[key] = resetPermissions(permsObj[key]);
        } else {
          reset[key] = false;
        }
      });
      return reset;
    };

    if (targetRoleId) {
      if (!roles[targetRoleId]) {
        return res.status(404).json({ error: "Global role template not found" });
      }

      const globalPerms = roles[targetRoleId].permissions || {};
      const resetPerms = resetPermissions(globalPerms);

      payload[targetRoleId] = {
        ...resetPerms,
        createdAt: Date.now(),
        createdBy: adminId,
      };
    } else {
      if (permSnap.exists()) {
        return res.json({
          success: true,
          message: "Permissions already initialized",
          permissions: existingData,
        });
      }

      Object.keys(roles).forEach((roleId) => {
        const globalPerms = roles[roleId].permissions || {};
        const resetPerms = resetPermissions(globalPerms);

        payload[roleId] = {
          ...resetPerms,
          createdAt: Date.now(),
          createdBy: adminId,
        };
      });
    }

    await set(permRef, payload);

    return res.json({
      success: true,
      message: "Permissions initialized successfully",
      permissions: payload,
    });
  } catch (err) {
    console.error("INIT PLACE PERMISSIONS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET PERMISSIONS FOR SALON / SPA
 * URL: GET /api/admin/place/:type/:placeId/permissions
 */
export const getPlacePermissions = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    const snap = await get(
      ref(db, `salonandspa/${type}/${placeId}/permissions`)
    );

    if (!snap.exists()) {
      return res.status(404).json({ error: "Permissions not initialized" });
    }

    return res.json(snap.val());
  } catch (err) {
    console.error("GET PLACE PERMISSIONS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
/**
 * UPDATE PERMISSIONS (CHECKBOX SAVE)
 * URL: PUT /api/admin/place/:type/:placeId/permissions/:roleId
 */
export const updatePlaceRolePermissions = async (req, res) => {
  try {
    const { type, placeId, roleId } = req.params;
    const adminId = req.user.uid;
    const { permissions } = req.body;

    if (typeof permissions !== "object") {
      return res.status(400).json({ error: "Invalid permissions" });
    }

    const rolePermRef = ref(
      db,
      `salonandspa/${type}/${placeId}/permissions/${roleId}`
    );

    await set(rolePermRef, {
      ...permissions,
      updatedAt: Date.now(),
      updatedBy: adminId,
    });

    return res.json({
      success: true,
      message: "Permissions updated successfully",
    });
  } catch (err) {
    console.error("UPDATE PLACE PERMISSIONS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* =====================================================
   SERVICE CATEGORIES MANAGEMENT
   ===================================================== */

/**
 * ADD SERVICE CATEGORY
 * URL: POST /api/admin/salon/:salonId/service-categories
 */
export const addServiceCategory = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { type, placeId } = req.params;
    const { name, description } = req.body;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const basePath = type === "salon" ? "salons" : "spas";
    const placeRef = ref(db, `salonandspa/${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    const placeData = placeSnap.val();
    const isOwner = placeData.ownerId === adminId;
    const isMasterEmployee = String(placeData.masterEmployeeId) === String(adminId);

    if (!isOwner && !isMasterEmployee) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const categoryRef = push(
      ref(db, `salonandspa/${basePath}/${placeId}/serviceCategories`)
    );
    const categoryId = categoryRef.key;

    const categoryData = {
      id: categoryId,
      name: name.trim(),
      description: description || "",
      isActive: true,
      createdAt: Date.now(),
    };

    /* 📸 IMAGE */
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const filePath = `salonandspa/categories/${placeId}/${categoryId}-${Date.now()}.${ext}`;
      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      categoryData.image = await getDownloadURL(imgRef);
      categoryData.imagePath = filePath;
    } else {
      categoryData.image = "";
      categoryData.imagePath = "";
    }

    await set(categoryRef, categoryData);

    return res.status(201).json({
      message: "Category created successfully",
      category: categoryData,
    });
  } catch (err) {
    console.error("ADD CATEGORY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET ALL SERVICE CATEGORIES FOR A SALON
 * URL: GET /api/admin/salon/:salonId/service-categories
 */
export const getServiceCategories = async (req, res) => {
  try {
    const { type, placeId } = req.params;
    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }
    const basePath = type === "salon" ? "salons" : "spas";
    const categoriesRef = ref(
      db,
      `salonandspa/${basePath}/${placeId}/serviceCategories`
    );
    const snap = await get(categoriesRef);

    if (!snap.exists()) {
      return res.json([]);
    }

    const categories = Object.values(snap.val());
    return res.json(categories);
  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * UPDATE SERVICE CATEGORY
 * URL: PUT /api/admin/place/:type/:placeId/service-categories/:categoryId
 */
export const updateServiceCategory = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { type, placeId, categoryId } = req.params;
    const { name, description } = req.body;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const basePath = type === "salon" ? "salons" : "spas";
    const categoryRef = ref(
      db,
      `salonandspa/${basePath}/${placeId}/serviceCategories/${categoryId}`
    );
    const snap = await get(categoryRef);

    if (!snap.exists()) {
      return res.status(404).json({ error: "Category not found" });
    }

    const categoryData = snap.val();

    /* 🔐 Ownership check via place */
    const placeRef = ref(db, `salonandspa/${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);
    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    const placeData = placeSnap.val();
    const isOwner = placeData.ownerId === adminId;
    const isMasterEmployee = String(placeData.masterEmployeeId) === String(adminId);

    if (!isOwner && !isMasterEmployee) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updates = {
      updatedAt: Date.now(),
    };

    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description;

    /* 📸 IMAGE UPDATE */
    if (req.file) {
      if (categoryData.imagePath) {
        try {
          await deleteObject(storageRef(storage, categoryData.imagePath));
        } catch (e) {
          console.warn("OLD IMAGE DELETE FAILED:", e.message);
        }
      }

      const ext = req.file.originalname.split(".").pop();
      const filePath = `salonandspa/categories/${placeId}/${categoryId}-${Date.now()}.${ext}`;
      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      updates.image = await getDownloadURL(imgRef);
      updates.imagePath = filePath;
    }

    await update(categoryRef, updates);

    return res.json({ message: "Category updated successfully" });
  } catch (err) {
    console.error("UPDATE CATEGORY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * DELETE SERVICE CATEGORY
 * URL: DELETE /api/admin/salon/:salonId/service-categories/:categoryId
 */
export const deleteServiceCategory = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { type, placeId, categoryId } = req.params;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const basePath = type === "salon" ? "salons" : "spas";
    const categoryRef = ref(
      db,
      `salonandspa/${basePath}/${placeId}/serviceCategories/${categoryId}`
    );
    const snap = await get(categoryRef);

    if (!snap.exists()) {
      return res.status(404).json({ error: "Category not found" });
    }

    /* 🔐 Ownership check via place */
    const placeRef = ref(db, `salonandspa/${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);
    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    const placeData = placeSnap.val();
    const isOwner = placeData.ownerId === adminId;
    const isMasterEmployee = String(placeData.masterEmployeeId) === String(adminId);

    if (!isOwner && !isMasterEmployee) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const categoryData = snap.val();

    if (categoryData.imagePath) {
      try {
        await deleteObject(storageRef(storage, categoryData.imagePath));
      } catch (e) {
        console.warn("IMAGE DELETE FAILED:", e.message);
      }
    }

    await set(categoryRef, null);

    return res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("DELETE CATEGORY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET OR INIT PERMISSIONS FOR A SPECIFIC ROLE
 * Handles automatic fallback to global templates.
 */
export const getOrInitPlaceRolePermissions = async (req, res) => {
  try {
    const { type, placeId, roleId } = req.params;
    const adminId = req.user.uid;

    if (!["salons", "spas"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const salonPermPath = `salonandspa/${type}/${placeId}/permissions/${roleId}`;
    const salonPermSnap = await get(ref(db, salonPermPath));

    if (salonPermSnap.exists()) {
      return res.json(salonPermSnap.val());
    }

    // Fallback to Global Roles
    const globalRoleSnap = await get(ref(db, `salonandspa/roles/${roleId}`));
    if (!globalRoleSnap.exists()) {
      return res.status(404).json({ error: "Global role template not found" });
    }

    const globalRole = globalRoleSnap.val();
    const globalPerms = globalRole.permissions || {};

    // Initialize the salon-specific path with global defaults
    const newSessionPerms = {
      ...globalPerms,
      createdAt: Date.now(),
      createdBy: adminId,
    };

    await set(ref(db, salonPermPath), newSessionPerms);

    return res.json(newSessionPerms);
  } catch (err) {
    console.error("GET OR INIT PERMISSIONS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
