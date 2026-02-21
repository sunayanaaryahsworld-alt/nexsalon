import { ref, get, push, update, query, orderByChild, equalTo } from "firebase/database";
import { db } from "../config/firebase.js";

/* Update Spa Details */
const ALLOWED_GENDERS = ["Male", "Female", "Unisex"];

export const updateSpaDetails = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { spaId } = req.params;
    const { address, pincode, gstNumber, phone, email, website, gender, description, latitude, longitude } = req.body || {};
     
    if (!spaId) {
      return res.status(400).json({ error: "Spa ID is required" });
    }

    const spaRef = ref(db, `salonandspa/spas/${spaId}`);
    const spaSnap = await get(spaRef);
    if (!spaSnap.exists()) {
      return res.status(404).json({ error: "Spa not found" });
    }

    const spaData = spaSnap.val();

    /**
     * 🔐 Ownership Check
     */
    if (spaData.ownerId !== adminId) {
      return res.status(403).json({
        error: "You are not authorized to update this spa",
      });
    }

    /**
     * 🧱 Build update object (partial update)
     */
    const updateData = {};

    if (address) updateData.address = address;
    if (pincode) updateData.pincode = pincode;
    if (gstNumber) updateData.gstNumber = gstNumber;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (website) updateData.website = website;
    if (gender !== undefined) {
      if (!ALLOWED_GENDERS.includes(gender)) {
        return res.status(400).json({
          error: "Invalid gender type. Allowed: ladies, gents, unisex"
        });
      }
      updateData.gender = gender;
    }
    if (description) updateData.description = description;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    console.log(updateData)
    /**
     * 📸 Image upload (from multer)
     */
    if (req.file) {
      updateData.image = `/uploads/spa/${req.file.filename}`;
    }
    console.log(updateData.image);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields provided to update",
      });
    }

    updateData.updatedAt = Date.now();

    await update(spaRef, updateData);

    return res.json({
      message: "Spa details updated successfully",
      spaId,
      updatedFields: Object.keys(updateData),
    });
  } catch (err) {
    console.error("UPDATE SPA ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
/* View Spa Details */
export const viewSpaDetails = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { spaId } = req.params;

    const spaRef = ref(db, `salonandspa/spas/${spaId}`);
    const spaSnap = await get(spaRef);

    if (!spaSnap.exists()) {
      return res.status(404).json({ error: "Spa not found" });
    }

    const spaData = spaSnap.val();

    if (spaData.ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({
      spaId,
      name: spaData.name,
      branch: spaData.branch || "",
      address: spaData.address || "",
      email: spaData.email || "",
      website: spaData.website || "",
      pincode: spaData.pincode || "",
      phone: spaData.phone || "",
      gstNumber: spaData.gstNumber || "",
      gender: spaData.gender || "",
      description: spaData.description || "",
      image: spaData.image || "",
      latitude: spaData.latitude || 0,
      longitude: spaData.longitude || 0,
      subscription: spaData.subscription || {},
      createdAt: spaData.createdAt,
      updatedAt: spaData.updatedAt || null
    });

  } catch (err) {
    console.log(err);
    console.error("VIEW SPA ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// /* Add Spa Employee */
// export const addSpaEmployee = async (req, res) => {
//   try {
//     const adminId = req.user.uid;
//     const { spaId } = req.params;
//     const { name, phone, role, email, experience, salary } = req.body;

//     if (!name || !phone || !role) {
//       return res.status(400).json({ error: "Name, phone, role required" });
//     }

//     const spaRef = ref(db, `salonandspa/spas/${spaId}`);
//     const spaSnap = await get(spaRef);

//     if (!spaSnap.exists()) return res.status(404).json({ error: "Spa not found" });
//     if (spaSnap.val().ownerId !== adminId)
//       return res.status(403).json({ error: "Unauthorized" });

//     const empRef = ref(db, "salonandspa/employees");
//     const phoneQuery = query(empRef, orderByChild("phone"), equalTo(phone));
//     const phoneSnap = await get(phoneQuery);

//     if (phoneSnap.exists()) {
//       return res.status(400).json({ error: "Phone already exists" });
//     }

//     const employeeRef = push(empRef);
//     const employeeId = employeeRef.key;

//     const employeeData = {
//       empid: employeeId,
//       name,
//       phone,
//       role,
//       email: email || "",
//       experience: experience || "0",
//       salary: salary || "0",
//       spaId,
//       ownerId: adminId,
//       createdAt: Date.now(),
//       isActive: true
//     };

//     const updates = {};
//     updates[`salonandspa/employees/${employeeId}`] = employeeData;
//     updates[`salonandspa/spas/${spaId}/employees/${employeeId}`] = true;

//     await update(ref(db), updates);

//     res.status(201).json({
//       message: "Spa employee added",
//       employeeId
//     });

//   } catch (err) {
//     console.error("ADD SPA EMPLOYEE ERROR:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };
// /* Update Spa Employee */
// export const updateSpaEmployee = async (req, res) => {
//   try {
//     const adminId = req.user.uid;
//     const { employeeId } = req.params;
//     const { name, phone, role, email, experience, salary } = req.body || {};

//     if (!employeeId) {
//       return res.status(400).json({ error: "Employee ID required" });
//     }

//     const empRef = ref(db, `salonandspa/employees/${employeeId}`);
//     const empSnap = await get(empRef);

//     if (!empSnap.exists()) {
//       return res.status(404).json({ error: "Employee not found" });
//     }

//     const empData = empSnap.val();

//     if (empData.ownerId !== adminId) {
//       return res.status(403).json({ error: "Unauthorized" });
//     }

//     // Phone uniqueness
//     if (phone && phone !== empData.phone) {
//       const phoneQuery = query(
//         ref(db, "salonandspa/employees"),
//         orderByChild("phone"),
//         equalTo(phone)
//       );
//       const phoneSnap = await get(phoneQuery);
//       if (phoneSnap.exists()) {
//         return res.status(400).json({ error: "Phone already in use" });
//       }
//     }

//     const updateData = {};
//     if (name) updateData.name = name;
//     if (phone) updateData.phone = phone;
//     if (role) updateData.role = role;
//     if (email) updateData.email = email;
//     if (experience) updateData.experience = experience;
//     if (salary) updateData.salary = salary;

//     if (!Object.keys(updateData).length) {
//       return res.status(400).json({ error: "No valid fields" });
//     }

//     updateData.updatedAt = Date.now();

//     await update(empRef, updateData);

//     res.json({
//       message: "Spa employee updated",
//       employeeId,
//       updatedFields: Object.keys(updateData)
//     });

//   } catch (err) {
//     console.error("UPDATE SPA EMPLOYEE ERROR:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// /* Get Spa Employees */
// export const getSpaEmployees = async (req, res) => {
//   try {
//     const adminId = req.user.uid;
//     const { spaId } = req.params;

//     const spaRef = ref(db, `salonandspa/spas/${spaId}`);
//     const spaSnap = await get(spaRef);

//     if (!spaSnap.exists()) return res.status(404).json({ error: "Spa not found" });
//     if (spaSnap.val().ownerId !== adminId)
//       return res.status(403).json({ error: "Unauthorized" });

//     const empIds = spaSnap.val().employees || {};
//     const employees = [];

//     for (const empId of Object.keys(empIds)) {
//       const empSnap = await get(ref(db, `salonandspa/employees/${empId}`));
//       if (empSnap.exists() && empSnap.val().isActive) {
//         employees.push(empSnap.val());
//       }
//     }

//     res.json({
//       spaId,
//       totalEmployees: employees.length,
//       employees
//     });

//   } catch (err) {
//     console.error("GET SPA EMPLOYEES ERROR:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };
export const addSpaService = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { spaId } = req.params;

    const { name, price, duration, category, description } = req.body;

    if (!name || !price || !duration) {
      return res.status(400).json({ error: "Name, price, duration required" });
    }

    const spaRef = ref(db, `salonandspa/spas/${spaId}`);
    const spaSnap = await get(spaRef);

    if (!spaSnap.exists()) return res.status(404).json({ error: "Spa not found" });
    if (spaSnap.val().ownerId !== adminId)
      return res.status(403).json({ error: "Unauthorized" });

    const serviceRef = push(ref(db, `salonandspa/spas/${spaId}/services`));
    const serviceId = serviceRef.key;

    await update(serviceRef, {
      serviceId,
      name,
      price,
      duration,
      category: category || "",
      description: description || "",
      image: req.file ? `/uploads/services/${req.file.filename}` : "",
      isActive: true,
      createdAt: Date.now()
    });

    res.status(201).json({
      message: "Service added successfully",
      serviceId
    });
  } catch (err) {
    console.error("ADD SERVICE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const getSpaServices = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { spaId } = req.params;

    const spaRef = ref(db, `salonandspa/spas/${spaId}`);
    const spaSnap = await get(spaRef);

    if (!spaSnap.exists()) {
      return res.status(404).json({ error: "Spa not found" });
    }

    if (spaSnap.val().ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const servicesRef = ref(
      db,
      `salonandspa/spas/${spaId}/services`
    );
    const servicesSnap = await get(servicesRef);

    if (!servicesSnap.exists()) {
      return res.json({
        spaId,
        services: []
      });
    }

    const services = Object.values(servicesSnap.val())
      .filter(service => service.isActive);

    return res.json({
      spaId,
      totalServices: services.length,
      services
    });

  } catch (err) {
    console.error("GET SERVICES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const updateSpaService = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { spaId, serviceId } = req.params;

    const spaRef = ref(db, `salonandspa/spas/${spaId}`);
    const spaSnap = await get(spaRef);

    if (!spaSnap.exists()) return res.status(404).json({ error: "Spa not found" });
    if (spaSnap.val().ownerId !== adminId)
      return res.status(403).json({ error: "Unauthorized" });

    const serviceRef = ref(db, `salonandspa/spas/${spaId}/services/${serviceId}`);
    const serviceSnap = await get(serviceRef);

    if (!serviceSnap.exists()) return res.status(404).json({ error: "Service not found" });
        const serviceData = serviceSnap.val();

    // 🚫 BLOCK UPDATE IF SERVICE IS INACTIVE
    if (serviceData.isActive === false) {
      return res.status(400).json({
        error: "Inactive service cannot be updated"
      });
    }
    const updateData = { ...req.body, updatedAt: Date.now() };

    if (req.file) {
      updateData.image = `/uploads/services/${req.file.filename}`;
    }

    await update(serviceRef, updateData);

    res.json({ message: "Service updated successfully" });
  } catch (err) {
    console.error("UPDATE SERVICE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const deleteSpaService = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { spaId, serviceId } = req.params;

    const spaRef = ref(db, `salonandspa/spas/${spaId}`);
    const spaSnap = await get(spaRef);

    if (!spaSnap.exists()) {
      return res.status(404).json({ error: "Spa not found" });
    }

    if (spaSnap.val().ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await update(
      ref(db, `salonandspa/spas/${spaId}/services/${serviceId}`),
      {
        isActive: false,
        deletedAt: Date.now()
      }
    );

    return res.json({
      message: "Service deactivated successfully"
    });

  } catch (err) {
    console.error("DELETE SERVICE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
/* Toggle Spa Service Active/Inactive */
export const toggleSpaService = async (req, res) => {
  try {
    const adminId = req.user.uid;
    const { spaId, serviceId } = req.params;

    const spaRef = ref(db, `salonandspa/spas/${spaId}`);
    const spaSnap = await get(spaRef);

    if (!spaSnap.exists()) {
      return res.status(404).json({ error: "Spa not found" });
    }

    if (spaSnap.val().ownerId !== adminId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const serviceRef = ref(
      db,
      `salonandspa/spas/${spaId}/services/${serviceId}`
    );
    const serviceSnap = await get(serviceRef);

    if (!serviceSnap.exists()) {
      return res.status(404).json({ error: "Service not found" });
    }

    const currentStatus = serviceSnap.val().isActive === true;

    await update(serviceRef, {
      isActive: !currentStatus,
      updatedAt: Date.now()
    });

    return res.json({
      message: `Service ${currentStatus ? "deactivated" : "activated"} successfully`,
      serviceId,
      isActive: !currentStatus
    });

  } catch (err) {
    console.error("TOGGLE SERVICE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};


/**
 * Get all customers of a particular salon
 * Route: GET /api/adminspa/:salonId/customers
 */



export const getSalonCustomers = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is required",
      });
    }

    /* ================= FETCH APPOINTMENTS ================= */
    const apptPath = `salonandspa/appointments/salon/${salonId}`;
    const apptSnap = await get(ref(db, apptPath));

    if (!apptSnap.exists()) {
      return res.json({
        success: true,
        count: 0,
        customers: [],
      });
    }

    const appointmentsObj = apptSnap.val();
    const appointments = Object.values(appointmentsObj);

    /* ================= AGGREGATE BY CUSTOMER ================= */
    const customerMap = {};

    for (const appt of appointments) {
      let key = null;
      let customerType = "walkin";

      /* -------- IDENTIFY CUSTOMER -------- */
      if (appt.customerId) {
        key = `REG_${appt.customerId}`;
        customerType = "registered";
      } else if (appt.customer?.phone) {
        key = `WALKIN_${appt.customer.phone}`;
        customerType = appt.mode || "walkin";
      }

      if (!key) {
        continue;
      }

      /* -------- INIT CUSTOMER -------- */
      if (!customerMap[key]) {
        customerMap[key] = {
          customerId: appt.customerId || null,
          name: appt.customer?.name || "Walk-in Client",
          phone: appt.customer?.phone || "",
          email: appt.customer?.email || "",
          customerType,
          visits: 0,
          totalSpent: 0,
          lastVisit: 0,
          membership: null,
          rating: 0,
          createdAt: null,
          modes: new Set(),
          appointments: [],
        };
      }

      /* -------- VISITS -------- */
      customerMap[key].visits += 1;

      /* -------- MODE -------- */
      customerMap[key].modes.add(appt.mode || "unknown");

      /* -------- TOTAL AMOUNT -------- */
      let amount = 0;

      if (typeof appt.totalAmount === "number") {
        amount = appt.totalAmount;
      } else if (Array.isArray(appt.services)) {
        appt.services.forEach((s) => {
          amount += Number(s.price || 0);
        });
      }

      customerMap[key].totalSpent += amount;

      /* -------- LAST VISIT -------- */
      let visitTime = appt.createdAt || 0;

      if (!visitTime && appt.date) {
        visitTime = new Date(
          appt.date.split("-").reverse().join("-")
        ).getTime();
      }

      if (visitTime > customerMap[key].lastVisit) {
        customerMap[key].lastVisit = visitTime;
      }

      /* -------- STORE FULL APPOINTMENT -------- */
      customerMap[key].appointments.push({
        appointmentId: appt.appointmentId,
        mode: appt.mode,
        status: appt.status,
        paymentStatus: appt.paymentStatus || "",
        totalAmount: amount,
        date: appt.date,
        startTime: appt.startTime,
        services: appt.services || [],
      });
    }

    /* ================= MERGE REGISTERED CUSTOMER DB ================= */
    const custSnap = await get(ref(db, "salonandspa/customer"));
    const customersDB = custSnap.exists() ? custSnap.val() : {};

    const customers = [];

    for (const key of Object.keys(customerMap)) {
      const c = customerMap[key];

      if (c.customerId && customersDB[c.customerId]) {
        const dbCust = customersDB[c.customerId];

        c.name = dbCust.name || c.name;
        c.phone = dbCust.phone || c.phone;
        c.email = dbCust.email || c.email;
        c.membership = dbCust.tier || null;
        c.rating = Number(dbCust.rating || 0);
        c.createdAt = dbCust.createdAt || null;
      }

      customers.push({
        ...c,
        modes: Array.from(c.modes), // ✅ convert Set → Array
      });
    }

    return res.json({
      success: true,
      count: customers.length,
      customers,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch salon customers",
    });
  }
};