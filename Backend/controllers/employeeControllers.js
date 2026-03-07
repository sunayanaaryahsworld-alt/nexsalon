import { ref, get, push, set, remove, update, query, orderByChild, equalTo } from "firebase/database";
import { db, storage } from "../config/firebase.js";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { logActivity } from "./activityLogController.js";

const toMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const normalizeDateToDMY = (dateStr) => {
  if (!dateStr) return null;

  const parts = dateStr.split("-");

  // YYYY-MM-DD
  if (parts[0].length === 4) {
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  }

  // DD-MM-YYYY
  if (parts[2].length === 4) {
    return dateStr;
  }

  return null; // invalid format
};

const minsToTime = (m) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
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

    /* ---------------- APPOINTMENTS ---------------- */
    const apptRef = ref(db, `salonandspa/appointments/${type}/${placeId}`);
    const apptSnap = await get(apptRef);

    if (!apptSnap.exists()) {
      return res.json({
        type,
        placeId,
        totalAppointments: 0,
        appointments: []
      });
    }

    const appointments = apptSnap.val();
    const result = [];

    /* ---------------- LOOP APPOINTMENTS ---------------- */
    for (const [appointmentId, appt] of Object.entries(appointments)) {

      /* -------- CUSTOMER -------- */
      let customer = null;

      // Validate snapshot properly
      if (
        appt.customer &&
        (appt.customer.name || appt.customer.phone || appt.customer.email)
      ) {
        customer = appt.customer;
      }
      else if (appt.customerId) {
        const custSnap = await get(
          ref(db, `salonandspa/customer/${appt.customerId}`)
        );

        if (custSnap.exists()) {
          customer = custSnap.val();
        }
      }

      customer = customer || {};



      /* -------- EMPLOYEE -------- */
      const empSnap = await get(
        ref(db, `salonandspa/employees/${appt.employeeId}`)
      );
      const employee = empSnap.exists() ? empSnap.val() : {};

      /* -------- SERVICES (FULL DETAILS) -------- */
      const enrichedServices = [];

      for (const svc of appt.services || []) {
        const serviceSnap = await get(
          ref(
            db,
            `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/services/${svc.serviceId}`
          )
        );

        const serviceData = serviceSnap.exists()
          ? serviceSnap.val()
          : {};

        enrichedServices.push({
          serviceId: svc.serviceId,

          // from appointment (final billed values)
          //   bookedPrice: svc.price,
          //   bookedDuration: svc.duration,

          // from master service
          name: serviceData.name || "",
          category: serviceData.category || "",
          image: serviceData.image || "",
          basePrice: serviceData.price || "",
          baseDuration: serviceData.duration || "",

          isActive: serviceData.isActive ?? false
        });
      }

      result.push({
        appointmentId,
        type,

        date: appt.date,
        startTime: appt.startTime,
        status: appt.status,

        paymentId: appt.paymentId,
        paymentStatus: appt.paymentStatus,

        totalAmount: appt.totalAmount,
        totalDuration: appt.totalDuration,

        customer: {
          customerId: appt.customerId || null,
          name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || ""
        },

        employee: {
          employeeId: appt.employeeId,
          name: employee.name || "",
          phone: employee.phone || "",
          image: employee.image || ""
        },

        services: enrichedServices,
        createdAt: appt.createdAt
      });
    }

    /* ---------------- SORT ---------------- */
    result.sort(
      (a, b) =>
        new Date(`${a.date} ${a.startTime}`) -
        new Date(`${b.date} ${b.startTime}`)
    );

    return res.status(200).json({
      type,
      placeId,
      totalAppointments: result.length,
      appointments: result
    });

  } catch (err) {
    console.error("GET APPOINTMENTS ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch appointments"
    });
  }
};



export const createWalkinAppointment = async (req, res) => {
  try {
    const { type, salonId, spaId } = req.body;
    const employeeIdFromToken = req.user.uid; // logged-in employee

    const {
      employeeId, // selected service provider (can be null / undefined)
      customer_name,
      customer_phone,
      customer_email,
      customer_gender,
      customer_age,
      services,
      date,
      startTime,
      paymentId
    } = req.body;

    /* ---------------- BASIC VALIDATION ---------------- */
    if (!type || !["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid business type" });
    }

    if (!customer_name || !customer_phone || !services?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!employeeId) {
      return res.status(400).json({
        error: "Employee must be selected for walk-in booking"
      });
    }

    const placeId = type === "salon" ? salonId : spaId;
    const basePath = type === "salon" ? "salons" : "spas";

    if (!placeId) {
      return res.status(400).json({ error: "Salon/Spa ID is required" });
    }

    /* ---------------- VERIFY SALON / SPA ---------------- */
    const placeRef = ref(db, `salonandspa/${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);

    if (!placeSnap.exists()) {
      return res.status(404).json({ error: "Salon/Spa not found" });
    }

    const place = placeSnap.val();

    /* ---------------- VERIFY MASTER EMPLOYEE ---------------- */
    if (!place.masterEmployeeId) {
      return res.status(400).json({
        error: "Master employee not assigned to this salon/spa"
      });
    }

    const isMasterEmployee =
      String(place.masterEmployeeId) === String(employeeIdFromToken);

    const isOwner =
      String(place.ownerId) === String(employeeIdFromToken);

    if (!isMasterEmployee && !isOwner) {
      return res.status(403).json({
        error: "Only master employee or owner can create walk-in bookings"
      });
    }


    /* ---------------- VERIFY SELECTED EMPLOYEE ---------------- */
    if (employeeId) {
      const empRef = ref(db, `salonandspa/employees/${employeeId}`);
      const empSnap = await get(empRef);

      if (!empSnap.exists()) {
        return res.status(404).json({ error: "Selected employee not found" });
      }

      const emp = empSnap.val();

      const linkedToPlace =
        emp.salonid1 === placeId ||
        emp.salonId === placeId ||
        emp.spaid1 === placeId;

      if (!linkedToPlace) {
        return res.status(403).json({
          error: "Selected employee does not belong to this salon/spa"
        });
      }

      if (emp.isActive === false) {
        return res.status(403).json({
          error: "Selected employee is inactive"
        });
      }
    }

    /* ---------------- CALCULATE TOTAL ---------------- */
    let totalAmount = 0;
    let totalDuration = 0;

    services.forEach((service) => {
      totalAmount += Number(service.price || 0);
      totalDuration += Number(service.duration || 0);
    });


    /* ---------------- BLOCK PAST TIME ---------------- */
    const todayISO = new Date().toLocaleDateString("en-CA");
    // gives YYYY-MM-DD in local timezone
    const newStartMin = toMinutes(startTime);
    const newEndMin = newStartMin + totalDuration;

    if (date === todayISO) {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();

      if (newStartMin <= nowMins) {
        return res.status(400).json({
          error: "Cannot book a slot in the past"
        });
      }
    }

    /* ---------------- SLOT DATE NORMALIZATION ---------------- */
    const formattedDateForSlots = normalizeDateToDMY(date);
    if (!formattedDateForSlots) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const slotsRef = ref(
      db,
      `salonandspa/${basePath}/${placeId}/slots/${formattedDateForSlots}`
    );


    /* ---------------- CHECK APPOINTMENT LEVEL CONFLICT ---------------- */
    const apptsSnap = await get(
      ref(db, `salonandspa/appointments/${type}/${placeId}`)
    );

    if (apptsSnap.exists()) {
      const appts = Object.values(apptsSnap.val());

      const apptConflict = appts.find((a) => {
        if (a.status !== "booked") return false;
        if (String(a.employeeId) !== String(employeeId)) return false;
        if (a.date !== formattedDateForSlots) return false;

        const aStart = toMinutes(a.startTime);
        const aEnd = aStart + Number(a.totalDuration || 0);

        return newStartMin < aEnd && newEndMin > aStart;
      });

      if (apptConflict) {
        return res.status(409).json({
          error: "Employee already has an appointment at this time"
        });
      }
    }

    /* ---------------- CHECK SLOT AVAILABILITY ---------------- */
    const slotsSnap = await get(slotsRef);

    if (slotsSnap.exists()) {
      const existingSlots = Object.values(slotsSnap.val());

      const conflict = existingSlots.find((s) => {
        if (!s) return false;
        if (s.status?.toLowerCase() === "cancelled") return false;

        const sStart = toMinutes(s.startTime);
        const sEnd = toMinutes(s.endTime);

        // Block only same employee
        if (employeeId) {
          if (String(s.employeeId) !== String(employeeId)) return false;
        }

        return newStartMin < sEnd && newEndMin > sStart;
      });

      if (conflict) {
        return res.status(409).json({
          error: "This slot is already booked for the selected employee and time"
        });
      }
    }


    /* ---------------- CREATE APPOINTMENT ---------------- */
    const apptRef = push(
      ref(db, `salonandspa/appointments/${type}/${placeId}`)
    );
    const appointmentId = apptRef.key;

    const appointmentData = {
      appointmentId,
      type,
      placeId,
      mode: "walkin",
      bookedByEmployeeId: employeeIdFromToken,
      customer: {
        name: customer_name,
        phone: customer_phone,
        email: customer_email || "",
        gender: customer_gender || "",
        age: customer_age || ""
      },
      employeeId: employeeId || null,
      services,
      date: formattedDateForSlots,
      startTime,
      totalAmount,
      totalDuration,
      paymentId: paymentId || "WALKIN",
      paymentStatus: "paid",
      status: "booked",
      createdAt: Date.now()
    };

    await set(apptRef, appointmentData);

    /* ---------------- CREATE SLOTS ---------------- */
    const slotUpdates = {};
    let currentStart = newStartMin;

    services.forEach((s, idx) => {
      const empId = s.employeeId || employeeId;
      const duration = Number(s.duration || 30);

      const slotKey = `${appointmentId}_${idx}`;
      slotUpdates[slotKey] = {
        appointmentId,
        employeeId: empId,
        serviceId: s.serviceId,
        startTime: minsToTime(currentStart),
        endTime: minsToTime(currentStart + duration),
        duration,
        status: "booked"
      };

      currentStart += duration;
    });

    if (Object.keys(slotUpdates).length > 0) {
      await update(slotsRef, slotUpdates);
    }

    // LOG ACTIVITY
    await logActivity({
      businessId: placeId,
      user: req.user,
      type: "Appointments",
      activity: `Walk-in appointment created for ${customer_name}`,
    });
    res.locals.skipActivityLog = true;

    return res.status(201).json({
      message: "Walk-in appointment booked successfully",
      appointment: appointmentData
    });

  } catch (error) {
    console.error("WALK-IN APPOINTMENT ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
};



export const getEnrichedAppointments = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    // 1. Fetch data nodes in parallel
    const [apptsSnap, employeesSnap, customersSnap, placeSnap] = await Promise.all([
      get(ref(db, `salonandspa/appointments/${type}/${placeId}`)),
      get(ref(db, `salonandspa/employees`)),
      get(ref(db, `salonandspa/customer`)),
      get(ref(db, `salonandspa/${type}s/${placeId}`))
    ]);

    if (!apptsSnap.exists()) {
      return res.status(200).json({ success: true, stats: { total: 0, today: 0, thisWeek: 0 }, data: [] });
    }

    const appointmentsData = apptsSnap.val();
    const employeesRegistry = employeesSnap.val() || {};
    const customersRegistry = customersSnap.val() || {};
    const placeData = placeSnap.val() || {};
    const masterServices = placeData.services || {};

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    let todayCount = 0;
    let weekCount = 0;

    // 2. Map, Spread (Dynamic), and add Mode
    const enrichedAppointments = Object.values(appointmentsData).map((appt) => {

      // Calculate stats
      if (appt.date === todayStr) todayCount++;
      const apptDate = new Date(appt.date);
      if (apptDate >= sevenDaysAgo && apptDate <= now) weekCount++;

      // Determine Display Mode
      const bookingMode = (appt.mode === "walkin" || appt.customer) ? "Walk-in" : "Online";

      // Enrichment
      const employee = employeesRegistry[appt.employeeId] || { name: "Unassigned" };

      let customerInfo = {};
      if (bookingMode === "Walk-in") {
        customerInfo = { ...appt.customer, isWalkIn: true };
      } else {
        const regCust = customersRegistry[appt.customerId] || {};
        customerInfo = { ...regCust, isWalkIn: false };
      }

      const detailedServices = (appt.services || []).map(s => {
        const meta = masterServices[s.serviceId] || {};
        return { ...meta, ...s };
      });

      return {
        ...appt,             // Keep all original fields (Dynamic)
        bookingMode,         // "Walk-in" or "Online"
        customer: customerInfo,
        employee: {
          ...employee,
          id: appt.employeeId
        },
        services: detailedServices
      };
    });

    // 3. Sort by Date & Time
    enrichedAppointments.sort((a, b) => {
      const parseDate = (d, t) => {
        const parts = d.split("-");
        const [h, m] = t.split(":").map(Number);
        if (parts[0].length === 4) {
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), h, m);
        } else {
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), h, m);
        }
      };

      const dateA = parseDate(a.date, a.startTime);
      const dateB = parseDate(b.date, b.startTime);
      return dateB - dateA;
    });

    return res.status(200).json({
      success: true,
      stats: {
        total: enrichedAppointments.length,
        today: todayCount,
        thisWeek: weekCount
      },
      data: enrichedAppointments
    });

  } catch (error) {
    console.error("DYNAMIC FETCH ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};




export const cancelAppointment = async (req, res) => {
  try {
    const { type, placeId, appointmentId } = req.params;
    const loggedInEmpId = req.user.uid;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    /* 1️⃣ Get Appointment */
    const apptRef = ref(
      db,
      `salonandspa/appointments/${type}/${placeId}/${appointmentId}`
    );
    const apptSnap = await get(apptRef);

    if (!apptSnap.exists()) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const appointment = apptSnap.val();

    /* 2️⃣ Get Place */
    const placePath =
      type === "salon"
        ? `salonandspa/salons/${placeId}`
        : `salonandspa/spas/${placeId}`;

    const placeSnap = await get(ref(db, placePath));
    if (!placeSnap.exists()) {
      return res.status(404).json({ error: "Salon/Spa not found" });
    }

    const place = placeSnap.val();

    /* 3️⃣ Authorization
       - Either assigned employee
       - OR master employee of that salon/spa
    */
    const isAssignedEmployee =
      String(appointment.employeeId) === String(loggedInEmpId);

    const isMasterEmployee =
      String(place.masterEmployeeId) === String(loggedInEmpId);

    if (!isAssignedEmployee && !isMasterEmployee) {
      return res.status(403).json({ error: "Not authorized" });
    }

    /* 4️⃣ Update Appointment Status (Master Record) */
    await update(apptRef, {
      status: "cancelled",
      cancelledBy: loggedInEmpId,
      cancelledAt: Date.now(),
    });

    /* 5️⃣ Update Customer Appointment (ONLY if online booking) */
    if (appointment.customerId) {
      const custApptRef = ref(
        db,
        `salonandspa/customer/${appointment.customerId}/appointments/${appointmentId}`
      );

      await update(custApptRef, {
        status: "cancelled",
      });
    }

    /* 6️⃣ Remove All Associated Slots */
    const formatDateDMY = (dateStr) => {
      const parts = dateStr.split("-");
      if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return dateStr;
    };

    const slotDateKey = formatDateDMY(appointment.date);
    const slotsRef = ref(
      db,
      `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/slots/${slotDateKey}`
    );

    const slotsSnap = await get(slotsRef);
    if (slotsSnap.exists()) {
      const allSlots = slotsSnap.val();
      const updates = {};
      Object.keys(allSlots).forEach(key => {
        if (key.startsWith(appointmentId)) {
          updates[key] = null; // Mark for deletion
        }
      });
      if (Object.keys(updates).length > 0) {
        await update(slotsRef, updates);
      }
    }

    // LOG ACTIVITY
    await logActivity({
      businessId: placeId,
      user: req.user,
      type: "Appointments",
      activity: `Appointment cancelled`,
    });
    res.locals.skipActivityLog = true;

    /* 7️⃣ Final Response */
    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointmentId,
      type,
      placeId,
    });
  } catch (err) {
    console.error("CANCEL APPOINTMENT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const { type, placeId, appointmentId, newDate, newStartTime } = req.body;
    const employeeUid = req.user.uid;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    /* 1️⃣ Get original appointment */
    const apptRef = ref(db, `salonandspa/appointments/${type}/${placeId}/${appointmentId}`);
    const apptSnap = await get(apptRef);
    if (!apptSnap.exists()) return res.status(404).json({ error: "Appointment not found" });

    const appointment = apptSnap.val();

    /* 2️⃣ Time helper */
    const toMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const toTime = (m) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

    /* 3️⃣ Prepare employee blocks (same as customer) */
    const newStartMin = toMinutes(newStartTime);
    const formattedDate = newDate; // DD-MM-YYYY

    const empBlocks = {};
    let currentStart = newStartMin;

    appointment.services.forEach((s) => {
      const empId = s.employeeId || appointment.employeeId;
      if (!empBlocks[empId]) {
        empBlocks[empId] = { services: [], start: currentStart, duration: 0 };
      }
      empBlocks[empId].services.push(s.serviceId);
      empBlocks[empId].duration += Number(s.duration);
      currentStart += Number(s.duration);
    });

    /* 4️⃣ Validate overlap */
    const allApptsSnap = await get(ref(db, `salonandspa/appointments/${type}/${placeId}`));
    const existing = allApptsSnap.exists() ? Object.values(allApptsSnap.val()) : [];

    for (const empId in empBlocks) {
      const block = empBlocks[empId];
      const start = block.start;
      const end = start + block.duration;

      const overlap = existing.find((a) => {
        if (a.appointmentId === appointmentId) return false;
        if (a.date === formattedDate && a.status === "booked") {
          const matches =
            a.employeeId === empId ||
            (Array.isArray(a.services) && a.services.some((s) => s.employeeId === empId));

          if (matches) {
            const aStart = toMinutes(a.startTime);
            const aEnd = aStart + Number(a.totalDuration || 0);
            return start < aEnd && end > aStart;
          }
        }
        return false;
      });

      if (overlap) {
        return res
          .status(409)
          .json({ error: `Selected slot overlaps with another booking ` });
      }
    }
    /* 4.5️⃣ Validate overlap using SLOTS also */
    const formattedSlotDate = formattedDate; // already in DD-MM-YYYY

    const slotsRef = ref(
      db,
      `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/slots/${formattedSlotDate}`
    );

    const slotsSnap = await get(slotsRef);

    if (slotsSnap.exists()) {
      const slots = Object.values(slotsSnap.val());

      for (const empId in empBlocks) {
        const block = empBlocks[empId];
        const start = block.start;
        const end = start + block.duration;

        const slotConflict = slots.find((s) => {
          if (!s) return false;
          if (s.status?.toLowerCase() === "cancelled") return false;

          // Skip its own old slots
          if (String(s.appointmentId) === String(appointmentId)) return false;

          // Must match same employee
          if (String(s.employeeId) !== String(empId)) return false;

          const sStart = toMinutes(s.startTime);
          const sEnd = toMinutes(s.endTime);

          return start < sEnd && end > sStart;
        });

        if (slotConflict) {
          return res.status(409).json({
            error: "Slot already occupied for selected employee and time"
          });
        }
      }
    }

    /* 5️⃣ Remove old slots */
    const partsOld = appointment.date.split("-");
    const oldFormattedDate =
      partsOld[0].length === 4
        ? `${partsOld[2]}-${partsOld[1]}-${partsOld[0]}`
        : appointment.date;

    const oldSlotsRef = ref(
      db,
      `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/slots/${oldFormattedDate}`
    );

    const oldSlotsSnap = await get(oldSlotsRef);
    if (oldSlotsSnap.exists()) {
      const updates = {};

      // LOG ACTIVITY
      await logActivity({
        businessId: placeId,
        user: req.user,
        type: "Appointments",
        activity: `Appointment rescheduled to ${newDate} ${newStartTime}`,
      });
      res.locals.skipActivityLog = true;
      Object.keys(oldSlotsSnap.val()).forEach((key) => {
        if (key.startsWith(appointmentId)) updates[key] = null;
      });
      await update(oldSlotsRef, updates);
    }

    /* 6️⃣ Create new slots */
    const newSlots = {};
    for (const empId in empBlocks) {
      const block = empBlocks[empId];
      newSlots[`${appointmentId}_${empId}`] = {
        appointmentId,
        employeeId: empId,
        startTime: toTime(block.start),
        endTime: toTime(block.start + block.duration),
        duration: block.duration,
        servicesId: block.services,
        status: "booked",
        rescheduledBy: "employee",
        rescheduledById: employeeUid,
        createdAt: Date.now(),
      };
    }

    await set(
      ref(
        db,
        `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/slots/${formattedDate}`
      ),
      newSlots
    );

    /* 7️⃣ Update appointment */
    const updatedData = {
      ...appointment,
      date: formattedDate,
      startTime: newStartTime,
      rescheduledAt: Date.now(),
      rescheduledBy: "employee",
      rescheduledById: employeeUid,
    };

    await set(apptRef, updatedData);

    /* 8️⃣ Update customer copy */
    const custApptRef = ref(
      db,
      `salonandspa/customer/${appointment.customerId}/appointments/${appointmentId}`
    );
    await update(custApptRef, { date: formattedDate, startTime: newStartTime });

    return res.json({
      message: "Appointment rescheduled successfully by employee",
      appointmentId,
    });
  } catch (err) {
    console.error("EMPLOYEE RESCHEDULE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getBookedSlotsByDate = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds } = req.user;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    const formattedDate = normalizeDateToDMY(date);

    if (!formattedDate) {
      return res.status(400).json({
        error: "Invalid date format. Use YYYY-MM-DD or DD-MM-YYYY"
      });
    }

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Only receptionist allowed" });
    }

    let type, placeId;
    if (salonIds?.length) {
      type = "salon";
      placeId = salonIds[0];
    } else if (spaIds?.length) {
      type = "spa";
      placeId = spaIds[0];
    } else {
      return res.status(403).json({ error: "No assigned salon or spa" });
    }

    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    const slotsRef = ref(
      db,
      `${basePath}/${placeId}/slots/${formattedDate}`
    );

    const snap = await get(slotsRef);

    if (!snap.exists()) {
      return res.json({
        success: true,
        type,
        placeId,
        date: formattedDate,
        slots: []
      });
    }

    const slots = Object.values(snap.val())
      .filter(s => s.status === "booked")   // 👈 Only booked ones
      .map((s) => ({
        appointmentId: s.appointmentId,
        employeeId: s.employeeId,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        status: s.status,
      }));


    return res.json({
      success: true,
      type,
      placeId,
      date: formattedDate,
      totalSlots: slots.length,
      slots
    });
  } catch (err) {
    console.error("EMPLOYEE GET BOOKED SLOTS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getEmployeeFullPlaceDetails = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds } = req.user;

    // Only master employee can access
    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Only receptionist and admin allowed" });
    }

    let type, placeId;

    if (salonIds?.length > 0) {
      type = "salon";
      placeId = salonIds[0];
    } else if (spaIds?.length > 0) {
      type = "spa";
      placeId = spaIds[0];
    } else {
      return res.status(403).json({ error: "No assigned salon or spa" });
    }

    const placePath =
      type === "salon"
        ? `salonandspa/salons/${placeId}`
        : `salonandspa/spas/${placeId}`;

    const placeSnap = await get(ref(db, placePath));
    if (!placeSnap.exists()) {
      return res.status(404).json({ error: "Place not found" });
    }

    const placeData = placeSnap.val();

    // Fetch all employees
    const allEmpSnap = await get(ref(db, "salonandspa/employees"));
    const allEmployees = allEmpSnap.exists() ? allEmpSnap.val() : {};

    const linkedEmployees = placeData.employees || {};
    const employees = Object.values(linkedEmployees)
      .map(({ employeeId }) => {
        const emp = allEmployees[employeeId];
        if (!emp) return null;
        return {
          empid: emp.empid,
          name: emp.name,
          phone: emp.phone,
          role: emp.role,
          image: emp.image,
          services: emp.services ? Object.values(emp.services) : [],
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      place: {
        id: placeId,
        type,
        ...placeData,
      },
      employees,
    });
  } catch (err) {
    console.error("EMPLOYEE PLACE DETAILS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const addServiceToEmployee = async (req, res) => {
  try {
    const { employeeId, serviceId, name, duration, price } = req.body;

    if (!employeeId || !serviceId) {
      return res.status(400).json({
        message: "employeeId and serviceId are required",
      });
    }

    /* 1️⃣ Find salonId via salons → employees */
    const salonsRef = ref(db, "salonandspa/salons");
    const salonsSnap = await get(salonsRef);

    let salonId = null;

    salonsSnap.forEach((salonNode) => {
      const salonData = salonNode.val();

      if (salonData.employees && salonData.employees[employeeId]) {
        salonId = salonNode.key;
      }
    });

    if (!salonId) {
      return res.status(400).json({
        message: "Employee is not linked to any salon",
      });
    }


    /* 2️⃣ Find admin owning this salon */
    const adminRef = ref(db, "salonandspa/admin");
    const adminSnap = await get(adminRef);

    let adminId = null;

    adminSnap.forEach((adminNode) => {
      const adminData = adminNode.val();

      Object.keys(adminData).forEach((key) => {
        if (key.startsWith("salonid") && adminData[key] === salonId) {
          adminId = adminNode.key;
        }
      });
    });

    if (!adminId) {
      return res.status(403).json({
        message: "No admin found for this salon",
      });
    }

    /* 3️⃣ Add service to employee */
    const servicesRef = ref(
      db,
      `salonandspa/employees/${employeeId}/services`
    );

    const newServiceRef = push(servicesRef);

    await set(newServiceRef, {
      name,
      duration,
      price,
      learnedAt: Date.now(),
      approvedByAdmin: adminId,
    });


    return res.json({
      success: true,
      message: "Service added to employee successfully",
      salonId,
      adminId,
    });
  } catch (error) {
    console.error("Add service error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    // console.log("\n /api/clients HIT");
    // console.log(" Type:", type);
    // console.log(" Place ID:", placeId);

    /* ---------------- VALIDATION ---------------- */
    if (!type || !["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Type must be salon or spa" });
    }

    if (!placeId) {
      return res.status(400).json({ error: "Place ID missing" });
    }

    /* ---------------- FETCH APPOINTMENTS ---------------- */
    const apptPath = `salonandspa/appointments/${type}/${placeId}`;
    const snap = await get(ref(db, apptPath));

    if (!snap.exists()) {
      return res.json({
        success: true,
        totalClients: 0,
        clients: [],
      });
    }

    const appointmentsObj = snap.val();
    const appointments = Object.values(appointmentsObj);

    /* ---------------- GROUP BY CUSTOMER ---------------- */
    const clientMap = {};

    for (const appt of appointments) {
      let clientKey = null;

      // ✅ Registered customer
      if (appt.customerId) {
        clientKey = `uid_${appt.customerId}`;
      }
      // ✅ Walk-in / WhatsApp
      else if (appt.customer?.phone) {
        clientKey = `phone_${appt.customer.phone}`;
      }

      if (!clientKey) {
        continue;
      }

      if (!clientMap[clientKey]) {
        clientMap[clientKey] = {
          customerId: appt.customerId || null,
          name: appt.customer?.name || "Walk-in Client",
          phone: appt.customer?.phone || "",
          email: appt.customer?.email || "",
          visits: 0,
          totalSpent: 0,
          lastVisit: 0,
          modes: new Set(),
          appointments: [],
        };
      }

      /* ---------------- VISITS ---------------- */
      clientMap[clientKey].visits += 1;

      /* ---------------- MODE ---------------- */
      clientMap[clientKey].modes.add(appt.mode || "unknown");

      /* ---------------- AMOUNT ---------------- */
      let amount = 0;

      if (typeof appt.totalAmount === "number") {
        amount = appt.totalAmount;
      } else if (Array.isArray(appt.services)) {
        appt.services.forEach(s => {
          amount += Number(s.price || 0);
        });
      }

      clientMap[clientKey].totalSpent += amount;

      /* ---------------- LAST VISIT ---------------- */
      const visitTime =
        appt.createdAt ||
        (appt.date
          ? new Date(appt.date.split("-").reverse().join("-")).getTime()
          : 0);

      if (visitTime > clientMap[clientKey].lastVisit) {
        clientMap[clientKey].lastVisit = visitTime;
      }

      /* ---------------- STORE FULL APPOINTMENT ---------------- */
      clientMap[clientKey].appointments.push({
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

    /* ---------------- FORMAT RESPONSE ---------------- */
    const clients = Object.values(clientMap).map(c => ({
      id: c.customerId || c.phone,
      name: c.name,
      phone: c.phone,
      email: c.email,
      visits: c.visits,
      totalSpent: c.totalSpent,
      lastVisit: c.lastVisit,
      modes: Array.from(c.modes), // ✅ ALL MODES
      appointments: c.appointments, // ✅ FULL HISTORY
    }));

    return res.json({
      success: true,
      type,
      placeId,
      totalClients: clients.length,
      clients,
    });

  } catch (error) {
    console.error("GET CLIENTS ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const addService = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds } = req.user;

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let basePath, placeId;
    if (salonIds?.length) {
      basePath = "salons";
      placeId = salonIds[0];
    } else if (spaIds?.length) {
      basePath = "spas";
      placeId = spaIds[0];
    } else {
      return res.status(403).json({ error: "No assigned branch" });
    }

    const { name, price, duration, category, description } = req.body;
    if (!name || !price || !duration) {
      return res.status(400).json({ error: "Name, price, duration required" });
    }

    const serviceRef = push(
      ref(db, `salonandspa/${basePath}/${placeId}/services`)
    );

    const serviceData = {
      serviceId: serviceRef.key,
      name,
      price: Number(price),
      duration: Number(duration),
      category: category || "",
      description: description || "",
      isActive: true,
      createdAt: Date.now()
    };

    /* 📸 IMAGE → FIREBASE STORAGE */
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const filePath = `salonandspa/services/${placeId}/${serviceData.serviceId}-${Date.now()}.${ext}`;
      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(imgRef);
      serviceData.image = downloadURL;
      serviceData.imagePath = filePath;
    } else {
      serviceData.image = "";
      serviceData.imagePath = "";
    }

    await set(serviceRef, serviceData);

    return res.status(201).json({
      message: "Service added successfully",
      service: serviceData
    });
  } catch (err) {
    console.error("ADD SERVICE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const getServices = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds } = req.user;

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let basePath, placeId;
    if (salonIds?.length) {
      basePath = "salons";
      placeId = salonIds[0];
    } else if (spaIds?.length) {
      basePath = "spas";
      placeId = spaIds[0];
    } else {
      return res.status(403).json({ error: "No assigned branch" });
    }

    const snap = await get(
      ref(db, `salonandspa/${basePath}/${placeId}/services`)
    );

    const services = snap.exists()
      ? Object.values(snap.val())
      : [];

    return res.json({
      success: true,
      services
    });

  } catch (err) {
    console.error("GET SERVICES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const updateService = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds } = req.user;
    const { serviceId } = req.params;

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let basePath, placeId;
    if (salonIds?.length) {
      basePath = "salons";
      placeId = salonIds[0];
    } else if (spaIds?.length) {
      basePath = "spas";
      placeId = spaIds[0];
    } else {
      return res.status(403).json({ error: "No assigned branch" });
    }

    const serviceRef = ref(
      db,
      `salonandspa/${basePath}/${placeId}/services/${serviceId}`
    );

    const snap = await get(serviceRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Service not found" });
    }

    const { name, price, duration, category, description, popular, removeImage } = req.body;

    const updateData = {
      updatedAt: Date.now()
    };

    if (name) updateData.name = name;
    if (price) updateData.price = Number(price);
    if (duration) updateData.duration = Number(duration);
    if (category !== undefined) updateData.category = category || "";
    if (description !== undefined) updateData.description = description || "";
    if (popular !== undefined) updateData.popular = popular === "true";

    // 🔥 Handle image upload
    if (req.file) {
      const oldImagePath = snap.val().imagePath;
      if (oldImagePath) {
        try {
          await deleteObject(storageRef(storage, oldImagePath));
        } catch (e) {
          console.warn("Old image delete failed:", e.message);
        }
      }

      const ext = req.file.originalname.split(".").pop();
      const filePath = `salonandspa/services/${placeId}/${serviceId}-${Date.now()}.${ext}`;
      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(imgRef);
      updateData.image = downloadURL;
      updateData.imagePath = filePath;
    } else if (removeImage === "true") {
      // 🗑️ Handle explicit image removal
      const oldImagePath = snap.val().imagePath;
      if (oldImagePath) {
        try {
          await deleteObject(storageRef(storage, oldImagePath));
        } catch (e) {
          console.warn("Image delete failed during removal:", e.message);
        }
      }
      updateData.image = "";
      updateData.imagePath = "";
    }

    await update(serviceRef, updateData);

    return res.json({
      message: "Service updated successfully",
      updatedImage: updateData.image || null
    });
  } catch (err) {
    console.error("UPDATE SERVICE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const toggleServiceStatus = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds } = req.user;
    const { serviceId } = req.params;

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let basePath, placeId;

    if (salonIds?.length > 0) {
      basePath = "salons";
      placeId = salonIds[0];
    } else if (spaIds?.length > 0) {
      basePath = "spas";
      placeId = spaIds[0];
    } else {
      return res.status(403).json({ error: "No assigned salon or spa" });
    }

    const serviceRef = ref(
      db,
      `salonandspa/${basePath}/${placeId}/services/${serviceId}`
    );

    const snap = await get(serviceRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Service not found" });
    }

    const newStatus = !snap.val().isActive;

    await update(serviceRef, {
      isActive: newStatus,
      updatedAt: Date.now(),
    });

    return res.json({
      success: true,
      message: `Service ${newStatus ? "activated" : "deactivated"}`,
      isActive: newStatus,
    });
  } catch (err) {
    console.error("TOGGLE SERVICE STATUS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const getAllPlans = async (req, res) => {
  try {
    const snap = await get(ref(db, "salonandspa/plans"));

    if (!snap.exists()) {
      return res.json({ plans: [] });
    }

    const plans = Object.values(snap.val())
      .filter((plan) => plan.isActive === true)
      .sort((a, b) => a.createdAt - b.createdAt);

    return res.json({ plans });
  } catch (err) {
    console.error("GET PLANS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getSalonServicesForMasterEmployee = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds } = req.user;
    const { type, placeId } = req.params;

    // ✅ receptionist check
    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Only master employee allowed" });
    }

    // ✅ ensure this receptionist belongs to this place
    if (
      (type === "salon" && !salonIds?.includes(placeId)) ||
      (type === "spa" && !spaIds?.includes(placeId))
    ) {
      return res.status(403).json({ error: "Not assigned to this place" });
    }

    const servicesRef = ref(
      db,
      `salonandspa/${type}s/${placeId}/services`
    );

    const servicesSnap = await get(servicesRef);

    const services = Object.entries(servicesSnap.val()).map(
      ([serviceId, data]) => ({
        serviceId,
        ...data
      })
    );


    return res.json({
      placeId,
      totalServices: services.length,
      services
    });

  } catch (error) {
    console.error("GET SERVICES (MASTER EMPLOYEE) ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const genders = ["Male", "Female", "Other"];

export const addEmployeeByMasterEmployee = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds, uid } = req.user;

    // 🔐 Only master employee (receptionist)
    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Only master employee allowed" });
    }

    const { name, phone, role, email, gender, experience, salary, joiningDate } = req.body;
    let serviceIds = [];

    // Parse serviceIds if it's a JSON string (from FormData)
    if (req.body.serviceIds) {
      try {
        serviceIds = typeof req.body.serviceIds === 'string'
          ? JSON.parse(req.body.serviceIds)
          : req.body.serviceIds;
        if (!Array.isArray(serviceIds)) serviceIds = [];
      } catch (e) {
        console.error("❌ Error parsing serviceIds:", e);
        serviceIds = [];
      }
    }

    console.log("📥 Received serviceIds:", serviceIds);
    console.log("📥 Request body:", req.body);

    if (!name || !phone || !role || !gender) {
      return res.status(400).json({
        error: "Name, phone, role and gender are required",
      });
    }

    if (!genders.includes(gender)) {
      return res.status(400).json({
        error: "Invalid gender",
      });
    }

    if (serviceIds.length === 0) {
      return res.status(400).json({
        error: "At least one service must be assigned",
      });
    }

    // 📍 Determine salon or spa
    let placeId = salonIds?.[0] || spaIds?.[0];
    let placeType = salonIds?.length ? "salons" : "spas";

    if (!placeId) {
      return res.status(403).json({ error: "No assigned salon or spa" });
    }

    /**
     * 🚫 Global phone duplicate check
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
     * 📋 Validate services exist
     */
    const servicesRef = ref(db, `salonandspa/${placeType}/${placeId}/services`);
    const servicesSnap = await get(servicesRef);

    if (!servicesSnap.exists()) {
      return res.status(400).json({
        error: "No services found in your salon/spa",
      });
    }

    const services = servicesSnap.val();
    const validServiceIds = [];

    console.log("🔍 All available services:", Object.keys(services || {}));
    console.log("🔍 Validating serviceIds:", serviceIds);

    for (const serviceId of serviceIds) {
      if (services[serviceId] && services[serviceId].isActive !== false) {
        validServiceIds.push(serviceId);
        console.log(`✅ Service ${serviceId} is valid`);
      } else {
        console.log(`❌ Service ${serviceId} not found or inactive`);
      }
    }

    console.log("✅ Valid service IDs:", validServiceIds);

    if (validServiceIds.length === 0) {
      return res.status(400).json({
        error: "None of the selected services are valid or active",
      });
    }

    /**
     * 👤 Create employee
     */
    const employeeRef = push(empRef);
    const employeeId = employeeRef.key;

    /**
     * 👑 GET OWNER ID (so owner can manage this staff)
     */
    const placeRef = ref(db, `salonandspa/${placeType}/${placeId}`);
    const placeSnap = await get(placeRef);
    const placeData = placeSnap.exists() ? placeSnap.val() : {};
    const ownerId = placeData.ownerId; // The admin ID

    const employeeData = {
      empid: employeeId,
      name,
      phone,
      role,
      gender,
      email: email || "",
      experience: experience || "0",
      salary: salary || "0",
      joiningDate: joiningDate || new Date().toISOString().split('T')[0], // ✅ Added joiningDate
      ownerId: ownerId || uid, // ✅ Assign to owner (fallback to creator if missing)
      createdBy: uid,
      createdByRole: "master_employee",
      isActive: true,
      createdAt: Date.now(),
    };

    /* 📸 IMAGE UPLOAD */
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const filePath = `salonandspa/employees/${employeeId}-${Date.now()}.${ext}`;
      const imgRef = storageRef(storage, filePath);

      await uploadBytes(imgRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(imgRef);
      employeeData.image = downloadURL;
      employeeData.imagePath = filePath;
    } else {
      employeeData.image = "";
      employeeData.imagePath = "";
    }

    await set(employeeRef, employeeData);

    /**
     * 🔗 Link employee to salon/spa with services
     */
    const employeeServicesData = {};
    for (const serviceId of validServiceIds) {
      employeeServicesData[serviceId] = {
        serviceId,
        name: services[serviceId].name || "",
        isActive: true,
        linkedAt: Date.now(),
      };
    }

    console.log("💾 Storing employee services:", employeeServicesData);

    await set(
      ref(db, `salonandspa/${placeType}/${placeId}/employees/${employeeId}`),
      {
        employeeId,
        assignedBy: uid,
        assignedAt: Date.now(),
        services: employeeServicesData,
      }
    );

    console.log("✅ Employee link with services stored successfully");
    console.log(`📍 Path: salonandspa/${placeType}/${placeId}/employees/${employeeId}`);

    // 📝 Activity log
    await logActivity({
      businessId: placeId,
      user: req.user,
      type: "Staff",
      activity: `Staff added by receptionist: ${name}`,
    });
    res.locals.skipActivityLog = true;

    return res.status(201).json({
      message: "Employee added successfully",
      employeeId,
      employee: employeeData,
    });
  } catch (err) {
    console.error("ADD EMPLOYEE (MASTER) ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const updateEmployeeByMasterEmployee = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds, uid } = req.user;
    const { employeeId } = req.params;

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Only master employee allowed" });
    }

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    let placeId = salonIds?.[0] || spaIds?.[0];
    let placeType = salonIds?.length ? "salons" : "spas";

    if (!placeId) {
      return res.status(403).json({ error: "No assigned salon or spa" });
    }

    /**
     * 🔍 Check employee exists
     */
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    /**
     * 🔐 Check employee belongs to this salon/spa
     */
    const linkSnap = await get(
      ref(db, `salonandspa/${placeType}/${placeId}/employees/${employeeId}`)
    );

    if (!linkSnap.exists()) {
      return res.status(403).json({
        error: "Employee does not belong to your salon or spa",
      });
    }

    const { name, phone, role, email, experience, salary, joiningDate } = req.body;
    let serviceIds = [];

    // Parse serviceIds if it's a JSON string (from FormData)
    if (req.body.serviceIds) {
      try {
        serviceIds = typeof req.body.serviceIds === 'string'
          ? JSON.parse(req.body.serviceIds)
          : req.body.serviceIds;
        if (!Array.isArray(serviceIds)) serviceIds = [];
      } catch (e) {
        serviceIds = [];
      }
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (email) updateData.email = email;
    if (experience) updateData.experience = experience;
    if (salary) updateData.salary = salary;
    if (joiningDate) updateData.joiningDate = joiningDate;

    if (Object.keys(updateData).length === 0 && serviceIds.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateData.updatedAt = Date.now();

    await update(empRef, updateData);

    /**
     * 🔄 Update services if provided
     */
    if (serviceIds.length > 0) {
      const servicesRef = ref(db, `salonandspa/${placeType}/${placeId}/services`);
      const servicesSnap = await get(servicesRef);

      if (servicesSnap.exists()) {
        const services = servicesSnap.val();
        const employeeServicesData = {};

        for (const serviceId of serviceIds) {
          if (services[serviceId] && services[serviceId].isActive !== false) {
            employeeServicesData[serviceId] = {
              serviceId,
              name: services[serviceId].name || "",
              isActive: true,
              linkedAt: Date.now(),
            };
          }
        }

        console.log("💾 Updating employee services:", employeeServicesData);

        const linkRef = ref(db, `salonandspa/${placeType}/${placeId}/employees/${employeeId}`);
        const currentLink = (await get(linkRef)).val() || {};

        console.log("🔄 Current link before update:", currentLink);

        await set(linkRef, {
          ...currentLink,
          services: employeeServicesData,
        });
      }
    }

    // 📝 Log
    await logActivity({
      businessId: placeId,
      user: req.user,
      type: "Staff",
      activity: `Staff updated by receptionist`,
    });
    res.locals.skipActivityLog = true;

    return res.json({
      message: "Employee updated successfully",
      employeeId,
      updatedFields: Object.keys(updateData),
    });
  } catch (err) {
    console.error("UPDATE EMPLOYEE (MASTER) ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const getEmployeeByMasterEmployee = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds } = req.user;
    const { employeeId } = req.params;

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Only master employee allowed" });
    }

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    let placeId = salonIds?.[0] || spaIds?.[0];
    let placeType = salonIds?.length ? "salons" : "spas";

    if (!placeId) {
      return res.status(403).json({ error: "No assigned salon or spa" });
    }

    /**
     * 🔍 Fetch employee
     */
    const empSnap = await get(ref(db, `salonandspa/employees/${employeeId}`));

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    /**
     * 🔐 Check employee belongs to this salon/spa
     */
    const linkSnap = await get(
      ref(db, `salonandspa/${placeType}/${placeId}/employees/${employeeId}`)
    );

    if (!linkSnap.exists()) {
      return res.status(403).json({
        error: "Employee does not belong to your salon or spa",
      });
    }

    const employeeData = empSnap.val();
    const linkData = linkSnap.val();

    console.log("🔍 Full link data:", JSON.stringify(linkData, null, 2));
    console.log("🔍 Link Data Services:", linkData?.services);

    // Services are stored in the employee link data
    let services = [];
    if (linkData?.services) {
      services = Object.values(linkData.services);
      console.log("✅ Services found in linkData:", services);
    } else {
      console.log("⚠️ No services in linkData, checking global employee services");
      // Fallback: check if services are in the global employee object
      if (employeeData?.services) {
        services = Array.isArray(employeeData.services)
          ? employeeData.services
          : Object.values(employeeData.services);
        console.log("✅ Services found in employeeData:", services);
      }
    }

    console.log("📦 Final services to return:", services);

    return res.json({
      employee: {
        ...employeeData,
        services,
      },
    });
  } catch (err) {
    console.error("GET EMPLOYEE (MASTER) ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deactivateEmployeeByMasterEmployee = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds, uid } = req.user;
    const { employeeId } = req.params;

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Only master employee allowed" });
    }

    let placeId = salonIds?.[0] || spaIds?.[0];
    let placeType = salonIds?.length ? "salons" : "spas";

    if (!placeId) {
      return res.status(403).json({ error: "No assigned salon or spa" });
    }

    // 1. Check link existence
    const linkRef = ref(db, `salonandspa/${placeType}/${placeId}/employees/${employeeId}`);
    const linkSnap = await get(linkRef);

    if (!linkSnap.exists()) {
      return res.status(403).json({ error: "Employee does not belong to your salon or spa" });
    }

    // 2. Set isActive = false
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    await update(empRef, {
      isActive: false,
      deactivatedAt: Date.now(),
      deactivatedBy: uid
    });

    // 3. Log
    await logActivity({
      businessId: placeId,
      user: req.user,
      type: "Staff",
      activity: `Staff deactivated by receptionist`,
    });
    res.locals.skipActivityLog = true;

    return res.json({ message: "Employee deactivated successfully" });

  } catch (err) {
    console.error("DEACTIVATE EMPLOYEE (MASTER) ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const reactivateEmployeeByMasterEmployee = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds, uid } = req.user;
    const { employeeId } = req.params;

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Only master employee allowed" });
    }

    let placeId = salonIds?.[0] || spaIds?.[0];
    let placeType = salonIds?.length ? "salons" : "spas";

    if (!placeId) {
      return res.status(403).json({ error: "No assigned salon or spa" });
    }

    // 1. Check link existence
    const linkRef = ref(db, `salonandspa/${placeType}/${placeId}/employees/${employeeId}`);
    const linkSnap = await get(linkRef);

    if (!linkSnap.exists()) {
      return res.status(403).json({ error: "Employee does not belong to your salon or spa" });
    }

    // 2. Set isActive = true
    const empRef = ref(db, `salonandspa/employees/${employeeId}`);
    await update(empRef, {
      isActive: true, // ✅ Reactivate
      reactivatedAt: Date.now(),
      reactivatedBy: uid
    });

    // 3. Log
    await logActivity({
      businessId: placeId,
      user: req.user,
      type: "Staff",
      activity: `Staff reactivated by receptionist`,
    });
    res.locals.skipActivityLog = true;

    return res.json({ message: "Employee reactivated successfully" });

  } catch (err) {
    console.error("REACTIVATE EMPLOYEE (MASTER) ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getEmployeesForMaster = async (req, res) => {
  try {
    const { employeeType, salonIds, spaIds } = req.user;
    const { type, placeId } = req.params;

    if (employeeType !== "master_employee") {
      return res.status(403).json({ error: "Only master employee allowed" });
    }

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    // Authorization check
    if (type === "salon" && !salonIds?.includes(placeId)) {
      return res.status(403).json({ error: "Unauthorized access to this salon" });
    }
    if (type === "spa" && !spaIds?.includes(placeId)) {
      return res.status(403).json({ error: "Unauthorized access to this spa" });
    }

    const basePath = type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    // 1. Get Place Data
    const placeRef = ref(db, `${basePath}/${placeId}`);
    const placeSnap = await get(placeRef);
    if (!placeSnap.exists()) return res.status(404).json({ error: "Place not found" });

    const placeData = placeSnap.val();

    // 2. Get Employee IDs from place
    if (!placeData.employees) {
      return res.json({ employees: [] });
    }

    const empIds = Object.keys(placeData.employees);
    const employees = [];

    await Promise.all(empIds.map(async (empId) => {
      const empSnap = await get(ref(db, `salonandspa/employees/${empId}`));
      if (empSnap.exists()) {
        const emp = empSnap.val();
        // Include everyone, even inactive
        employees.push({
          employeeId: empId,
          name: emp.name,
          phone: emp.phone,
          email: emp.email,
          role: emp.role,
          isActive: emp.isActive,
          image: emp.image,
          salary: emp.salary,
          joiningDate: emp.joiningDate || (emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : null),
          createdAt: emp.createdAt,
        });
      }
    }));

    return res.json({
      type,
      placeId,
      totalEmployees: employees.length,
      employees,
    });

  } catch (err) {
    console.error("GET EMPLOYEES (MASTER) ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔒 PERMISSIONS: GET OR INIT FOR RECEPTIONISTS
export const getOrInitReceptionistPermissions = async (req, res) => {
  try {
    const { type, placeId } = req.params;
    const uid = req.user.uid;
    const roleId = "receptionist";

    if (!["salons", "spas"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const empRef = ref(db, `salonandspa/employees/${uid}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists() || empSnap.val().isActive !== true) {
      return res.status(403).json({ error: "Unauthorized or inactive account" });
    }

    const employee = empSnap.val();
    const assignedIds = Object.entries(employee)
      .filter(([key, value]) => (key.startsWith("salonid") || key.startsWith("spaid")) && value)
      .map(([_, value]) => value);

    if (!assignedIds.includes(placeId)) {
      return res.status(403).json({ error: "Access denied to this branch" });
    }

    const salonPermPath = `salonandspa/${type}/${placeId}/permissions/${roleId}`;
    const salonPermSnap = await get(ref(db, salonPermPath));

    if (salonPermSnap.exists()) {
      return res.json(salonPermSnap.val());
    }

    const globalRoleSnap = await get(ref(db, `salonandspa/roles/${roleId}`));
    if (!globalRoleSnap.exists()) {
      return res.status(404).json({ error: "Receptionist global template not found" });
    }

    const globalPerms = globalRoleSnap.val().permissions || {};
    const newSessionPerms = {
      ...globalPerms,
      createdAt: Date.now(),
      createdBy: uid,
      createdByType: "receptionist_bootstrap"
    };

    await set(ref(db, salonPermPath), newSessionPerms);
    return res.json(newSessionPerms);
  } catch (err) {
    console.error("GET OR INIT RECEPTIONIST PERMS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// 🔒 PERMISSIONS: GET OR INIT FOR STAFF
export const getOrInitStaffPermissions = async (req, res) => {
  try {
    const { type, placeId } = req.params;
    const uid = req.user.uid;
    const roleId = "staff";

    if (!["salons", "spas"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const empRef = ref(db, `salonandspa/employees/${uid}`);
    const empSnap = await get(empRef);

    if (!empSnap.exists() || empSnap.val().isActive !== true) {
      return res.status(403).json({ error: "Unauthorized or inactive account" });
    }

    const employee = empSnap.val();
    const assignedIds = Object.entries(employee)
      .filter(([key, value]) => (key.startsWith("salonid") || key.startsWith("spaid")) && value)
      .map(([_, value]) => value);

    if (!assignedIds.includes(placeId)) {
      return res.status(403).json({ error: "Access denied to this branch" });
    }

    const salonPermPath = `salonandspa/${type}/${placeId}/permissions/${roleId}`;
    const salonPermSnap = await get(ref(db, salonPermPath));

    if (salonPermSnap.exists()) {
      return res.json(salonPermSnap.val());
    }

    const globalRoleSnap = await get(ref(db, `salonandspa/roles/${roleId}`));
    if (!globalRoleSnap.exists()) {
      return res.status(404).json({ error: "Staff global template not found" });
    }

    const globalPerms = globalRoleSnap.val().permissions || {};
    const newSessionPerms = {
      ...globalPerms,
      createdAt: Date.now(),
      createdBy: uid,
      createdByType: "staff_bootstrap"
    };

    await set(ref(db, salonPermPath), newSessionPerms);
    return res.json(newSessionPerms);
  } catch (err) {
    console.error("GET OR INIT STAFF PERMS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
