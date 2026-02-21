import { ref, get, push, set, remove, update } from "firebase/database";
import { db } from "../config/firebase.js";
import { sendEmail } from "../utils/SendUserMail.js";

// Haversine formula to calculate distance in KM
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export const getServicesByPincode = async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!pincode) {
      return res.status(400).json({ error: "Pincode is required" });
    }

    const result = [];

    /**
     * ======================
     * 1️⃣ FETCH SALONS
     * ======================
     */
    const salonsRef = ref(db, "salonandspa/salons");
    const salonsSnap = await get(salonsRef);

    if (salonsSnap.exists()) {
      const salons = salonsSnap.val();

      for (const salonId in salons) {
        const salon = salons[salonId];

        if (salon.pincode?.trim() === pincode && salon.services) {
          for (const serviceId in salon.services) {
            const service = salon.services[serviceId];

            if (service.isActive) {
              result.push({
                type: "salon",
                shopId: salonId,
                shopName: salon.name,
                branch: salon.branch,
                phone: salon.phone,
                image: salon.image,
                serviceId,
                serviceName: service.name?.trim(),
                price: service.price,
                duration: service.duration,
                category: service.category?.trim(),
              });
            }
          }
        }
      }
    }

    /**
     * ======================
     * 2️⃣ FETCH SPAS
     * ======================
     */
    const spasRef = ref(db, "salonandspa/spas");
    const spasSnap = await get(spasRef);

    if (spasSnap.exists()) {
      const spas = spasSnap.val();

      for (const spaId in spas) {
        const spa = spas[spaId];

        if (spa.pincode?.trim() === pincode && spa.services) {
          for (const serviceId in spa.services) {
            const service = spa.services[serviceId];

            if (service.isActive) {
              result.push({
                type: "spa",
                shopId: spaId,
                shopName: spa.name,
                branch: spa.branch,
                phone: spa.phone,
                image: spa.image,
                serviceId,
                serviceName: service.name?.trim(),
                price: service.price,
                duration: service.duration,
                category: service.category?.trim(),
              });
            }
          }
        }
      }
    }

    return res.status(200).json({
      pincode,
      totalServices: result.length,
      services: result,
    });
  } catch (err) {
    console.error("GET CUSTOMER SERVICES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getCustomerBusinesses = async (req, res) => {
  try {
    const [salonsSnap, spasSnap, employeesSnap] = await Promise.all([
      get(ref(db, "salonandspa/salons")),
      get(ref(db, "salonandspa/spas")),
      get(ref(db, "salonandspa/employees")),
    ]);

    const allEmployees = employeesSnap.exists() ? employeesSnap.val() : {};

    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius);
    const loc = req.query.loc?.toString().trim().toLowerCase(); // ✅ ADDED: read city param

    const formatBusinesses = (data, type) => {
      if (!data) return [];

      return Object.entries(data).map(([placeId, item]) => {
        /* ---------------- SERVICES MAP ---------------- */
        const serviceMap = {};
        if (item.services) {
          Object.entries(item.services).forEach(([sid, svc]) => {
            if (svc.isActive === false) return;

            serviceMap[sid] = {
              serviceId: sid,
              name: svc.name?.trim() || "",
              price: Number(svc.price) || 0,
              duration: svc.duration || "",
              gender: svc.gender || "Unisex",
            };
          });
        }

        /* ---------------- EMPLOYEES ---------------- */
        const employees = item.employees
          ? Object.keys(item.employees)
              .map((employeeId) => {
                const emp = allEmployees[employeeId];
                if (!emp) return null;

                const employeeServices = [];

                if (emp.services) {
                  Object.values(emp.services).forEach((svc) => {
                    if (
                      svc.placeId === placeId &&
                      svc.type === type &&
                      svc.isActive === true &&
                      serviceMap[svc.serviceId]
                    ) {
                      employeeServices.push(serviceMap[svc.serviceId]);
                    }
                  });
                }

                return {
                  employeeId,
                  name: emp.name || "",
                  phone: emp.phone || "",
                  gender: emp.gender || "",
                  experience: emp.experience || 0,
                  image: emp.image || "",
                  isActive: emp.isActive === true,
                  services: employeeServices,
                };
              })
              .filter(Boolean)
          : [];

        /* ---------------- FINAL RESPONSE ---------------- */
        return {
          id: placeId,
          type,
          name: item.name || "",
          branch: item.branch || "",
          address: item.address || "",
          city: item.city || "",          // ✅ ADDED: include city in response
          pincode: item.pincode || "",
          phone: item.phone || "",
          gender: item.gender || "",
          image: item.image || "",
          rating: item.rating || 0,
          totalReviews: item.totalReviews || 0,
          timings: item.timings || {},
          latitude: item.latitude || 0,
          longitude: item.longitude || 0,
          services: Object.values(serviceMap),
          employees,
        };
      });
    };

    const response = {
      salons: salonsSnap.exists()
        ? formatBusinesses(salonsSnap.val(), "salon")
        : [],
      spas: spasSnap.exists() ? formatBusinesses(spasSnap.val(), "spa") : [],
    };

    // ✅ ADDED: Filter by city name if loc param provided (and no GPS coords)
    if (loc && (isNaN(userLat) || isNaN(userLng))) {
      const matchesCity = (b) => {
        const city = (b.city || "").toLowerCase();
        const address = (b.address || "").toLowerCase();
        const branch = (b.branch || "").toLowerCase();
        // Check city field first, then fallback to address/branch containing the city name
        return city.includes(loc) || address.includes(loc) || branch.includes(loc);
      };

      response.salons = response.salons.filter(matchesCity);
      response.spas = response.spas.filter(matchesCity);
    }

    // Calculate distance and filter by radius if coords provided
    if (!isNaN(userLat) && !isNaN(userLng)) {
      const processDistances = (businesses) => {
        return businesses
          .map((b) => {
            const distance = calculateDistance(
              userLat,
              userLng,
              b.latitude,
              b.longitude
            );
            return { ...b, distance };
          })
          .filter((b) => {
            if (!isNaN(radius) && radius > 0) {
              return b.distance !== null && b.distance <= radius;
            }
            return true;
          })
          .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      };

      response.salons = processDistances(response.salons);
      response.spas = processDistances(response.spas);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("CUSTOMER BUSINESSES ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch businesses",
    });
  }
};

export const bookAppointment = async (req, res) => {
  try {
    const {
      type,
      salonId,
      spaId,
      customerId,
      employeeId,
      services, // [{ serviceId, price, duration }]
      date,
      startTime,
      paymentId,
    } = req.body;
    const custId = req.user.uid;

    if (custId !== customerId) {
      return res
        .status(400)
        .json({ error: "not a valid user or token expired" });
    }
    /* ---------------- VALIDATION ---------------- */
    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "type must be salon or spa" });
    }

    if (!customerId || !employeeId || !date || !startTime || !paymentId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "services[] required" });
    }

    const placeId = type === "salon" ? salonId : spaId;
    if (!placeId) {
      return res.status(400).json({ error: `${type}Id is required` });
    }

    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    /* ---------------- CALCULATE TOTAL & PREPARE PER-EMPLOYEE BLOCKS ---------------- */
    let totalAmount = 0;
    let totalDuration = 0;
    const employeeServiceBlocks = {}; // Map employeeId -> { services, startTime, duration }

    // Helper to format date to DD-MM-YYYY (consistent with DB)
    const formatDateDMY = (dateStr) => {
      // If already DD-MM-YYYY
      if (dateStr.includes("-") && dateStr.split("-")[0].length === 2) {
        return dateStr;
      }
      // If YYYY-MM-DD
      const [year, month, day] = dateStr.split("-");
      return `${day}-${month}-${year}`;
    };
    const formattedDate = formatDateDMY(date);

    // time helpers
    const toMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const toTime = (m) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

    let currentStartMin = toMinutes(startTime);

    const servicesData = services.map((s) => {
      const price = Number(s.price) || 0;
      const duration = Number(s.duration) || 0;
      const svcEmployeeId = s.employeeId || employeeId; // Fallback to main employeeId

      totalAmount += price;
      totalDuration += duration;

      if (!employeeServiceBlocks[svcEmployeeId]) {
        employeeServiceBlocks[svcEmployeeId] = {
          services: [],
          startMin: currentStartMin,
          totalDuration: 0,
        };
      }
      employeeServiceBlocks[svcEmployeeId].services.push(s.serviceId);
      employeeServiceBlocks[svcEmployeeId].totalDuration += duration;

      // Note: This logic assumes services for a single booking are sequential even if multiple employees are involved.
      // If employees can work in parallel, this would need adjusting. But for a single customer, usually they are sequential.
      const svcData = {
        serviceId: s.serviceId,
        price,
        duration,
        employeeId: svcEmployeeId,
      };

      currentStartMin += duration; // Next service starts after this one
      return svcData;
    });

    /* ---------------- OVERLAP CHECK ---------------- */
    // Check for each employee involved in this booking
    const apptPath = `salonandspa/appointments/${type}/${placeId}`;
    const allApptsSnap = await get(ref(db, apptPath));
    const existingAppts = allApptsSnap.exists()
      ? Object.values(allApptsSnap.val())
      : [];

    for (const empId in employeeServiceBlocks) {
      const block = employeeServiceBlocks[empId];
      const start = block.startMin;
      const end = start + block.totalDuration;

      const isOverlapping = existingAppts.some((appt) => {
        // Only check same date, same employee, and active appointments
        if (appt.date === date && appt.status === "booked") {
          // Check if this appointment involves the same employee
          const apptMatchesEmp =
            appt.employeeId === empId ||
            (Array.isArray(appt.services) &&
              appt.services.some((s) => s.employeeId === empId));

          if (apptMatchesEmp) {
            // Check specific service overlaps if it's a multi-employee appointment
            // For simplicity, we check against the overall appointment window if it's a single employee appt
            // or we'd need to check individual service windows.
            // Let's use the overall window for now as "booked" means busy.
            const apptStart = toMinutes(appt.startTime);
            const apptEnd = apptStart + (Number(appt.totalDuration) || 0);

            return start < apptEnd && end > apptStart;
          }
        }
        return false;
      });

      if (isOverlapping) {
        return res
          .status(409)
          .json({
            error: `Selected slot overlaps with another booking for employee ${empId}`,
          });
      }
    }

    /* ---------------- CREATE APPOINTMENT ---------------- */
    const appointmentRef = push(
      ref(db, `salonandspa/appointments/${type}/${placeId}`),
    );

    const appointmentId = appointmentRef.key;

    const appointmentData = {
      appointmentId,
      type,
      placeId,
      customerId,
      employeeId, // Main employee or first one
      services: servicesData,
      date,
      mode:"online",
      startTime,
      totalAmount,
      totalDuration,
      paymentId,
      paymentStatus: "paid", // dummy payment
      status: "booked",
      createdAt: Date.now(),
    };

    /* ---------------- SAVE UNDER SALON / SPA ---------------- */
    await set(
      ref(db, `salonandspa/appointments/${type}/${placeId}/${appointmentId}`),
      appointmentData,
    );

    /* ---------------- SAVE UNDER CUSTOMER ---------------- */
    await set(
      ref(
        db,
        `salonandspa/customer/${customerId}/appointments/${appointmentId}`,
      ),
      {
        appointmentId,
        type,
        placeId,
        date,
        startTime,
        totalAmount,
        status: "booked",
        createdAt: Date.now(),
      },
    );
    /* ---------------- SAVE APPOINTMENT ID IN SALON/SPA SLOTS ---------------- */

    // Save slots for each employee involved
    for (const empId in employeeServiceBlocks) {
      const block = employeeServiceBlocks[empId];
      const slotData = {
        appointmentId,
        employeeId: empId,
        customerId,
        startTime: toTime(block.startMin),
        endTime: toTime(block.startMin + block.totalDuration),
        duration: block.totalDuration,
        servicesId: block.services,
        status: "booked",
        createdAt: Date.now(),
      };

      await set(
        ref(
          db,
          `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/slots/${formattedDate}/${appointmentId}_${empId}`,
        ),
        slotData,
      );
    }

    // ===================== SEND EMAILS =====================

    // basePath already defined above
    // const basePath = type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    /* 1. CUSTOMER */
    const customerSnap = await get(
      ref(db, `salonandspa/customer/${customerId}`),
    );
    if (!customerSnap.exists()) throw new Error("Customer not found");

    const customerData = customerSnap.val();
    const customerEmail = customerData.email;
    const customerName = customerData.name || "Customer";

    /* 2. PLACE (SALON / SPA) */
    const placeSnap = await get(ref(db, `${basePath}/${placeId}`));
    if (!placeSnap.exists()) throw new Error("Place not found");

    const placeData = placeSnap.val();
    const placeName = placeData.name || placeData.details?.name || "Our Salon";

    /* 3. ADMIN
/* 3. ADMIN (only admin who owns this salon/spa) */
    const adminSnap = await get(ref(db, "salonandspa/admin"));

    let adminEmail = null;
    let adminName = "Admin";
    let adminId = null;

    if (adminSnap.exists()) {
      const adminData = adminSnap.val();

      for (const [aid, admin] of Object.entries(adminData)) {
        const ids = [];

        // collect all salon ids
        Object.entries(admin).forEach(([key, value]) => {
          if (type === "salon" && key.startsWith("salonid") && value) {
            ids.push(String(value).trim());
          }
          if (type === "spa" && key.startsWith("spaid") && value) {
            ids.push(String(value).trim());
          }
        });

        console.log(`Checking admin ${aid}, owns:`, ids);

        if (ids.includes(String(placeId).trim())) {
          adminEmail = admin.email;
          adminName = admin.name || "Admin";
          adminId = aid;
          break;
        }
      }

      console.log("Matched Admin:", adminId, adminEmail);
    } else {
      console.log("No admin found in database");
    }

    /* 4. RECEPTIONIST (MASTER EMPLOYEE) */
    // After fetching placeData
    const masterEmpId = placeData.masterEmployeeId;

    console.log("Master Emp ID:", masterEmpId);

    let receptionistEmail = null;
    let receptionistName = null;

    if (masterEmpId) {
      const masterEmpSnap = await get(
        ref(db, `salonandspa/employees/${masterEmpId}`),
      );

      if (masterEmpSnap.exists()) {
        const masterEmp = masterEmpSnap.val();
        receptionistEmail = masterEmp.email;
        receptionistName = masterEmp.name;

        console.log("Receptionist Email:", receptionistEmail);
        console.log("Receptionist Name:", receptionistName);
      } else {
        console.log(
          "Master employee ID not found in employees table:",
          masterEmpId,
        );
      }
    } else {
      console.log("No masterEmployeeId assigned to this salon");
    }

    /* 5. EMPLOYEE */
    const employeeSnap = await get(
      ref(db, `salonandspa/employees/${employeeId}`),
    );
    if (!employeeSnap.exists()) throw new Error("Employee not found");

    const employeeData = employeeSnap.val();
    const employeeName = employeeData.name || "Employee";
    const employeeEmail = employeeData.email;

    /* 6. SERVICES (TAKE FROM SALON/SPA SERVICES, NOT EMPLOYEE) */
    const servicesSnap = await get(ref(db, `${basePath}/${placeId}/services`));
    if (!servicesSnap.exists()) throw new Error("Services not found");

    const allServices = servicesSnap.val();
    let serviceNames = [];

    for (const svc of services) {
      if (allServices[svc.serviceId]) {
        serviceNames.push(allServices[svc.serviceId].name);
      } else {
        serviceNames.push("Unknown Service");
      }
    }

    const serviceList = serviceNames.join(", ");

    // ===================== SEND EMAILS WITH FULL HTML TEMPLATES =====================
    const formatTimeAMPM = (time24) => {
      if (!time24) return "";
      let [hours, minutes] = time24.split(":").map(Number);
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12; // 0 -> 12
      return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    };

    /* ---------------- COMMON CSS + WRAPPER ---------------- */
    const emailWrapper = (title, body, footer) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {
    margin: 0;
    padding: 0;
    background: #FDFBF7;
    font-family: Georgia, serif;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #E8E2D9;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .header {
    background: #4A2C2C;
    color: #BC9C53;
    padding: 20px;
    text-align: center;
  }
  .header h2 {
    margin: 0;
    font-size: 20px;
    text-transform: uppercase;
  }
  .content {
    padding: 25px;
    color: #4A2C2C;
  }
  .box {
    background: #FDFBF7;
    border-left: 4px solid #BC9C53;
    padding: 15px;
    margin-top: 15px;
    border-radius: 6px;
  }
  .box p {
    margin: 6px 0;
    font-size: 14px;
  }
  .footer {
    text-align: center;
    font-size: 11px;
    color: #BC9C53;
    padding: 15px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${title}</h2>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      ${footer}
    </div>
  </div>
</body>
</html>
`;

    /* ---------------- CUSTOMER TEMPLATE ---------------- */
    const customerTemplate = (data) =>
      emailWrapper(
        "Appointment Confirmed ✨",
        `
    <p>Hello <b>${data.customerName}</b>,</p>
    <p>Your appointment has been successfully booked.</p>

    <div class="box">
      <b>${data.type === "salon" ? "Salon" : "Spa"}:</b> ${data.placeName}</p>
      <p><b>Staff:</b> ${data.employeeName}</p>
      <p><b>Date:</b> ${data.date}</p>
      <p><b>Time:</b> ${data.time}</p>
      <p><b>Services:</b> ${data.services}</p>
    </div>

    <p style="margin-top:20px;font-style:italic;">
      Please arrive 10 minutes early. We look forward to serving you!
    </p>
    `,
        `Thank you for choosing ${data.placeName} 💖
     <p>© ${new Date().getFullYear()} ${data.placeName}. All rights reserved.</p>`,
      );

    /* ---------------- ADMIN TEMPLATE ---------------- */
    const adminTemplate = (data) =>
      emailWrapper(
        "New Appointment Booked",
        `
    <p>Hello <b>${data.adminName}</b>,</p>
    <p>A new appointment has been booked.</p>

    <div class="box">
      <p><b>Place:</b> ${data.placeName}</p>
      <p><b>Customer:</b> ${data.customerName}</p>
      <p><b>Employee:</b> ${data.employeeName}</p>
      <p><b>Date:</b> ${data.date}</p>
      <p><b>Time:</b> ${data.time}</p>
      <p><b>Services:</b> ${data.services}</p>
    </div>
    `,
        ` <p>© ${new Date().getFullYear()} ${data.placeName}. All rights reserved.</p>`,
      );

    /* ---------------- RECEPTIONIST TEMPLATE ---------------- */
    const receptionistTemplate = (data) =>
      emailWrapper(
        "New Appointment Alert",
        `
    <p>Hello <b>${data.receptionistName}</b>,</p>
    <p>A new appointment has been scheduled.</p>

    <div class="box">
      <p><b>Customer:</b> ${data.customerName}</p>
      <p><b>Employee:</b> ${data.employeeName}</p>
      <p><b>Date:</b> ${data.date}</p>
      <p><b>Time:</b> ${data.time}</p>
      <p><b>Services:</b> ${data.services}</p>
    </div>
    `,
        ` <p>© ${new Date().getFullYear()} ${data.placeName}. All rights reserved.</p>`,
      );

    /* ---------------- EMPLOYEE TEMPLATE ---------------- */
    const employeeTemplate = (data) =>
      emailWrapper(
        "You Have a New Appointment",
        `
    <p>Hello <b>${data.employeeName}</b>,</p>
    <p>You have been assigned a new appointment.</p>

    <div class="box">
      <p><b>Customer:</b> ${data.customerName}</p>
      <p><b>Date:</b> ${data.date}</p>
      <p><b>Time:</b> ${data.time}</p>
      <p><b>Services:</b> ${data.services}</p>
    </div>
    `,
        ` <p>© ${new Date().getFullYear()} ${data.placeName}. All rights reserved.</p>`,
      );

    /* ---------------- DATA FOR ALL TEMPLATES ---------------- */
    const mailData = {
      type,
      customerName,
      employeeName,
      receptionistName,
      adminName,
      placeName,
      date,
      time: formatTimeAMPM(startTime),
      services: serviceList,
    };

    /* ---------------- SEND EMAILS ---------------- */
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: "New Appointment Booked",
        html: adminTemplate(mailData),
      });
    }

    if (receptionistEmail) {
      await sendEmail({
        to: receptionistEmail,
        subject: "New Appointment Alert",
        html: receptionistTemplate(mailData),
      });
    }

    if (employeeEmail) {
      await sendEmail({
        to: employeeEmail,
        subject: "You Have a New Appointment",
        html: employeeTemplate(mailData),
      });
    }

    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: "Appointment Confirmed ✨",
        html: customerTemplate(mailData),
      });
    }

    console.log("All emails sent successfully");
    // ===================== END EMAILS =====================

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointmentId,
      totalAmount,
      totalDuration,
    });
  } catch (err) {
    console.error("BOOK APPOINTMENT ERROR:", err);
    return res.status(500).json({ error: "Failed to book appointment" });
  }
};

export const getCustomerAppointments = async (req, res) => {
  try {
    const customerId = req.user.uid;
    const custId = req.params.customerId;

    if (!custId) {
      return res.status(400).json({ error: "customerId is required" });
    }

    if (customerId !== custId) {
      return res
        .status(400)
        .json({ error: "customerId is not proper or token invalid" });
    }
    /* ---------------- CUSTOMER APPOINTMENTS ---------------- */
    const custApptRef = ref(
      db,
      `salonandspa/customer/${customerId}/appointments`,
    );

    const custApptSnap = await get(custApptRef);

    if (!custApptSnap.exists()) {
      return res.json({
        customerId,
        appointments: [],
      });
    }

    const customerAppointments = custApptSnap.val();
    const result = [];

    /* ---------------- FETCH FULL DETAILS ---------------- */
    for (const appt of Object.values(customerAppointments)) {
      const { appointmentId, type, placeId } = appt;

      const appointmentRef = ref(
        db,
        `salonandspa/appointments/${type}/${placeId}/${appointmentId}`,
      );

      const appointmentSnap = await get(appointmentRef);
      if (!appointmentSnap.exists()) continue;

      const appointmentData = appointmentSnap.val();

      /* ---- GET SALON / SPA DETAILS ---- */
      const placeRef = ref(
        db,
        `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`,
      );

      const placeSnap = await get(placeRef);
      const place = placeSnap.exists() ? placeSnap.val() : {};

      /* ---- GET EMPLOYEE DETAILS ---- */
      const empSnap = await get(
        ref(db, `salonandspa/employees/${appointmentData.employeeId}`),
      );

      const employee = empSnap.exists() ? empSnap.val() : {};

      /* ---- GET SERVICE NAMES FROM SALON/SPA ---- */
      const servicesRef = ref(
        db,
        `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/services`,
      );

      const servicesSnap = await get(servicesRef);
      const allServices = servicesSnap.exists() ? servicesSnap.val() : {};

      /* ---- MAP SERVICES WITH NAMES ---- */
      const mappedServices = (appointmentData.services || []).map((s) => ({
        serviceId: s.serviceId,
        name: allServices[s.serviceId]?.name || "Service",
        price: s.price,
        duration: s.duration,
        image: allServices[s.serviceId]?.image || "",
      }));

      result.push({
        ...appointmentData,

        place: {
          id: placeId,
          name: place.name || "",
          address: place.address || "",
          phone: place.phone || "",
          image: place.image || "",
        },

        employee: {
          employeeId: appointmentData.employeeId,
          name: employee.name || "",
          phone: employee.phone || "",
          image: employee.image || "",
        },

        services: mappedServices, // 🔥 service names included
        createdAt: appointmentData.createdAt,
      });
    }

    return res.status(200).json({
      customerId,
      totalAppointments: result.length,
      appointments: result,
    });
  } catch (err) {
    console.error("GET CUSTOMER APPOINTMENTS ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch customer appointments",
    });
  }
};

export const getStaffAvailability = async (req, res) => {
  try {
    const { type, placeId, employeeId, date, serviceDuration } = req.body;

    if (!type || !placeId || !employeeId || !date || !serviceDuration) {
      return res.status(400).json({ error: "Missing fields" });
    }

    /* -------- GET EMPLOYEE & PLACE -------- */
    const [empSnap, placeSnap] = await Promise.all([
      get(ref(db, `salonandspa/employees/${employeeId}`)),
      get(ref(db, `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`))
    ]);

    if (!empSnap.exists()) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = empSnap.val();
    const place = placeSnap.exists() ? placeSnap.val() : {};

    // Robust Date Parsing for "day" calculation
    const partsReq = date.split("-");
    const dateForObj = partsReq[0].length === 4 ? date : `${partsReq[2]}-${partsReq[1]}-${partsReq[0]}`;
    const dateObj = new Date(dateForObj);
    const day = dateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    // Availability Fallback: Employee individual -> Venue Timings -> Default
    let work = employee.availability?.[day];
    if (!work && place.timings?.[day]) {
      const pWork = place.timings[day];
      if (pWork.isOpen !== false) {
        work = { start: pWork.open, end: pWork.close };
      }
    }
    
    if (!work) {
      return res.json({ employeeId, date, availableSlots: [], bookedIntervals: [] });
    }

    /* -------- GENERATE TIME SLOTS -------- */
    const toMinutes = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const toTime = (m) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

    const open = toMinutes(work.start || work.open);
    const close = toMinutes(work.end || work.close);
    const duration = Number(serviceDuration);

    if (!open || !close || open >= close) {
       return res.json({ employeeId, date, availableSlots: [], bookedIntervals: [] });
    }

    /* -------- FETCH STAFF APPOINTMENTS -------- */
    const apptPath = `salonandspa/appointments/${type}/${placeId}`;
    const apptSnap = await get(ref(db, apptPath));
    
    let booked = [];
    if (apptSnap.exists()) {
      Object.values(apptSnap.val()).forEach((a) => {
        const involvesEmployee = a.employeeId === employeeId || 
                               (Array.isArray(a.services) && a.services.some(s => s.employeeId === employeeId));

        // Robust date match for overlap check
        const partsA = a.date.split("-");
        const aDateNormalized = partsA[0].length === 4 ? a.date : `${partsA[2]}-${partsA[1]}-${partsA[0]}`;
        const reqDateNormalized = partsReq[0].length === 4 ? date : `${partsReq[2]}-${partsReq[1]}-${partsReq[0]}`;

        if (involvesEmployee && aDateNormalized === reqDateNormalized && a.status === "booked") {
          if (a.employeeId === employeeId && !Array.isArray(a.services)) {
            const start = toMinutes(a.startTime);
            const end = start + Number(a.totalDuration);
            booked.push({ start, end });
          } else if (Array.isArray(a.services)) {
            let currentSvcStart = toMinutes(a.startTime);
            let empStart = null;
            let empEnd = null;

            a.services.forEach(s => {
              const svcDuration = Number(s.duration) || 0;
              if (s.employeeId === employeeId) {
                if (empStart === null) empStart = currentSvcStart;
                empEnd = currentSvcStart + svcDuration;
              }
              currentSvcStart += svcDuration;
            });

            if (empStart !== null) {
              booked.push({ start: empStart, end: empEnd });
            }
          }
        }
      });
    }

    booked.sort((a, b) => a.start - b.start);

    /* -------- GENERATE DYNAMIC SLOTS (NO GAPS) -------- */
    let availableSlots = [];
    const checkAndAddSlots = (start, end) => {
      let tempStart = start;
      while (tempStart + duration <= end) {
        availableSlots.push(toTime(tempStart));
        tempStart += duration;
      }
    };

    let lastEnd = open;
    booked.forEach(b => {
      if (b.start > lastEnd) {
        checkAndAddSlots(lastEnd, b.start);
      }
      lastEnd = Math.max(lastEnd, b.end);
    });

    if (lastEnd < close) {
      checkAndAddSlots(lastEnd, close);
    }

    // Today/Future check
    const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    const isToday = dateObj.toDateString() === new Date().toDateString();
    
    if (isToday) {
      const nowMins = toMinutes(nowStr);
      availableSlots = availableSlots.filter(slot => toMinutes(slot) > nowMins + 15);
    }

    return res.json({
      employeeId,
      date,
      availableSlots: [...new Set(availableSlots)],
      bookedIntervals: booked.map(b => ({ startTime: toTime(b.start), endTime: toTime(b.end) })),
    });
  } catch (err) {
    console.error("AVAILABILITY ERROR:", err);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
};

export const getFullPlaceDetails = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    /* ---------------- BASIC VALIDATION ---------------- */

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const placePath =
      type === "salon"
        ? `salonandspa/salons/${placeId}`
        : `salonandspa/spas/${placeId}`;

    /* ---------------- FETCH PLACE ---------------- */
    const placeSnap = await get(ref(db, placePath));
    if (!placeSnap.exists()) {
      return res.status(404).json({ error: `${type} not found` });
    }

    const placeData = placeSnap.val();

    /* ---------------- OWNER CHECK ---------------- */

    /* ---------------- FETCH EMPLOYEES ---------------- */
    const employeesSnap = await get(ref(db, "salonandspa/employees"));
    const employeesData = employeesSnap.val() || {};

    const linkedEmployees = placeData.employees || {};

    const employees = Object.values(linkedEmployees)
      .map(({ employeeId }) => {
        const emp = employeesData[employeeId];
        if (!emp) return null;

        return {
          ...emp,
          services: emp.services ? Object.values(emp.services) : [],
        };
      })
      .filter(Boolean);

    /* ================= FETCH NEXT 7 DAYS SLOTS ================= */

    const allSlots = placeData.slots || {};
    const slotsByDate = {};

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + i);

      const dd = String(dateObj.getDate()).padStart(2, "0");
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const yyyy = dateObj.getFullYear();

      // YOUR DB FORMAT: DD-MM-YYYY
      const dateKey = `${dd}-${mm}-${yyyy}`;

      const daySlots = allSlots[dateKey] || {};

      slotsByDate[dateKey] = {
        date: dateKey,
        totalBookings: Object.keys(daySlots).length,
        bookings: Object.values(daySlots),
      };
    }

    /* ---------------- RESPONSE ---------------- */
    return res.status(200).json({
      success: true,
      type,
      place: {
        id: placeId,
        ...placeData,
      },
      employeesCount: employees.length,
      employees,
      slotsByDate, // ✅ DATE-WISE NEXT 7 DAYS
    });
  } catch (error) {
    console.error("GET FULL PLACE DETAILS ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const empSnap = await get(ref(db, "salonandspa/employees"));
    if (!empSnap.exists()) {
      return res.json({});
    }
    return res.json(empSnap.val());
  } catch (err) {
    console.error("GET EMPLOYEES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const cancelCustomerAppointment = async (req, res) => {
  try {
    const { type, placeId, appointmentId } = req.params;
    const customerId = req.user.uid;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    /* 1️⃣ Get appointment */
    const apptRef = ref(
      db,
      `salonandspa/appointments/${type}/${placeId}/${appointmentId}`,
    );

    const apptSnap = await get(apptRef);

    if (!apptSnap.exists()) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const appointment = apptSnap.val();

    /* 2️⃣ Check appointment belongs to this customer */
    if (String(appointment.customerId) !== String(customerId)) {
      return res.status(403).json({ error: "Not your appointment" });
    }

    /* 3️⃣ Time check (DD-MM-YYYY only, must cancel 1 hour before) */
    const now = new Date();

    // appointment.date can be "DD-MM-YYYY" or "YYYY-MM-DD"
    const [h, m] = appointment.startTime.split(":");
    const parts = appointment.date.split("-");
    let day, month, year;
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else {
      [day, month, year] = parts;
    }

    const apptTime = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(h),
      Number(m),
      0
    );

    const diffMinutes = (apptTime - now) / (1000 * 60);

    console.log("NOW:", now.toString());
    console.log("APPOINTMENT:", apptTime.toString());
    console.log("DIFF MINUTES:", diffMinutes);

    if (diffMinutes < 60) {
      return res.status(400).json({
        error: "You can cancel only at least 1 hour before the appointment",
      });
    }

    /* 4️⃣ Update appointment master record */
    await update(apptRef, {
      status: "cancelled",
      cancelledBy: customerId,
      cancelledByRole: "customer",
      cancelledAt: Date.now(),
    });

    /* 5️⃣ Update customer appointment copy */
    const custApptRef = ref(
      db,
      `salonandspa/customer/${customerId}/appointments/${appointmentId}`,
    );

    await update(custApptRef, {
      status: "cancelled",
    });

    /* 6️⃣ Remove slots for all employees involved */
    // Ensure we look in the correct DD-MM-YYYY path for slots
    const partsSlot = appointment.date.split("-");
    const formattedDateForSlots = partsSlot[0].length === 4 
      ? `${partsSlot[2]}-${partsSlot[1]}-${partsSlot[0]}` 
      : appointment.date;

    const slotsRef = ref(
      db,
      `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/slots/${formattedDateForSlots}`
    );
    const slotsSnap = await get(slotsRef);
    if (slotsSnap.exists()) {
      const updates = {};
      Object.keys(slotsSnap.val()).forEach(key => {
        if (key.startsWith(appointmentId)) {
          updates[key] = null;
        }
      });
      await update(slotsRef, updates);
    }

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointmentId,
    });
  } catch (err) {
    console.error("CUSTOMER CANCEL ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const { type, placeId, appointmentId, newDate, newStartTime } = req.body;
    const customerId = req.user.uid;

    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    /* 1️⃣ Get original appointment */
    const apptRef = ref(db, `salonandspa/appointments/${type}/${placeId}/${appointmentId}`);
    const apptSnap = await get(apptRef);
    if (!apptSnap.exists()) return res.status(404).json({ error: "Appointment not found" });
    
    const appointment = apptSnap.val();
    if (String(appointment.customerId) !== String(customerId)) {
      return res.status(403).json({ error: "Not your appointment" });
    }

    /* 2️⃣ Check 1-hour rule for original appointment */
    const now = new Date();
    const [h, min] = appointment.startTime.split(":");
    const parts = appointment.date.split("-");
    let d, m, y;
    if (parts[0].length === 4) {
      [y, m, d] = parts;
    } else {
      [d, m, y] = parts;
    }
    const apptTime = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
    if ((apptTime - now) / (1000 * 60) < 60) {
      return res.status(400).json({ error: "You can only reschedule at least 1 hour before the appointment" });
    }

    /* 3️⃣ Validate availability for NEW slot */
    const toMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

    const newStartMin = toMinutes(newStartTime);
    const formattedDate = newDate; // Assuming frontend sends DD-MM-YYYY

    // Prepare blocks for each employee involved
    const empBlocks = {};
    let currentStart = newStartMin;
    appointment.services.forEach(s => {
      const empId = s.employeeId || appointment.employeeId;
      if (!empBlocks[empId]) {
        empBlocks[empId] = { services: [], start: currentStart, duration: 0 };
      }
      empBlocks[empId].services.push(s.serviceId);
      empBlocks[empId].duration += Number(s.duration);
      currentStart += Number(s.duration);
    });

    // Check overlaps for each employee on the new date
    const allApptsSnap = await get(ref(db, `salonandspa/appointments/${type}/${placeId}`));
    const existing = allApptsSnap.exists() ? Object.values(allApptsSnap.val()) : [];

    for (const empId in empBlocks) {
      const block = empBlocks[empId];
      const start = block.start;
      const end = start + block.duration;

      const overlap = existing.find(a => {
        if (a.appointmentId === appointmentId) return false; // Ignore current appointment
        if (a.date === formattedDate && a.status === "booked") {
          const apptMatches = a.employeeId === empId || (Array.isArray(a.services) && a.services.some(s => s.employeeId === empId));
          if (apptMatches) {
            const aStart = toMinutes(a.startTime);
            const aEnd = aStart + (Number(a.totalDuration) || 0);
            return start < aEnd && end > aStart;
          }
        }
        return false;
      });

      if (overlap) return res.status(409).json({ error: `Selected slot overlaps with another booking for employee ${empId}` });
    }

    /* 4️⃣ Update records */
    // A. Remove old slots
    const partsOld = appointment.date.split("-");
    const oldFormattedDate = partsOld[0].length === 4 
      ? `${partsOld[2]}-${partsOld[1]}-${partsOld[0]}` 
      : appointment.date;

    const oldSlotsRef = ref(db, `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/slots/${oldFormattedDate}`);
    const oldSlotsSnap = await get(oldSlotsRef);
    if (oldSlotsSnap.exists()) {
      const updates = {};
      Object.keys(oldSlotsSnap.val()).forEach(key => { if (key.startsWith(appointmentId)) updates[key] = null; });
      await update(oldSlotsRef, updates);
    }

    // B. Create new slots & Update appointment
    const newSlots = {};
    for (const empId in empBlocks) {
      const block = empBlocks[empId];
      newSlots[`${appointmentId}_${empId}`] = {
        appointmentId,
        employeeId: empId,
        customerId,
        startTime: toTime(block.start),
        endTime: toTime(block.start + block.duration),
        duration: block.duration,
        servicesId: block.services,
        status: "booked",
        createdAt: Date.now()
      };
    }
    await set(ref(db, `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}/slots/${formattedDate}`), newSlots);

    const updatedData = {
      ...appointment,
      date: formattedDate,
      startTime: newStartTime,
      rescheduledAt: Date.now()
    };
    await set(apptRef, updatedData);

    // Update customer's list
    const custApptRef = ref(db, `salonandspa/customer/${customerId}/appointments/${appointmentId}`);
    await update(custApptRef, { date: formattedDate, startTime: newStartTime });

    return res.json({ message: "Appointment rescheduled successfully", appointmentId });
  } catch (err) {
    console.error("RESCHEDULE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getBookedSlotsByDate = async (req, res) => {
  try {
    const { type, placeId } = req.params;
    const { date } = req.query;

    /* ---------------- VALIDATION ---------------- */
    if (!["salon", "spa"].includes(type)) {
      return res.status(400).json({ error: "type must be salon or spa" });
    }

    if (!placeId) {
      return res.status(400).json({ error: "placeId is required" });
    }

    if (!date) {
      return res.status(400).json({ error: "date (YYYY-MM-DD) is required" });
    }

    /* ---------------- DATE FORMAT (DD-MM-YYYY) ---------------- */
    const formatDateDMY = (isoDate) => {
      const [year, month, day] = isoDate.split("-");
      return `${day}-${month}-${year}`;
    };

    const formattedDate = formatDateDMY(date);

    const basePath =
      type === "salon" ? "salonandspa/salons" : "salonandspa/spas";

    /* ---------------- FETCH SLOTS ---------------- */
    const slotsRef = ref(db, `${basePath}/${placeId}/slots/${formattedDate}`);

    const snapshot = await get(slotsRef);

    if (!snapshot.exists()) {
      return res.json({
        success: true,
        date: formattedDate,
        slots: [],
      });
    }

    const rawSlots = snapshot.val();

    /* ---------------- NORMALIZE ---------------- */
    const slots = Object.values(rawSlots).map((slot) => ({
      appointmentId: slot.appointmentId,
      employeeId: slot.employeeId,
      serviceId: slot.serviceId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status || "booked",
    }));

    return res.json({
      success: true,
      date: formattedDate, // ✅ DD-MM-YYYY returned
      slots,
    });
  } catch (err) {
    console.error("GET BOOKED SLOTS ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch booked slots",
    });
  }
};

export const addReview = async (req, res) => {
  try {
    const { type, placeId, appointmentId, rating, comment } = req.body;
    const customerId = req.user.uid;

    if (!type || !placeId || !appointmentId || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Verify appointment exists and belongs to user
    const apptRef = ref(db, `salonandspa/appointments/${type}/${placeId}/${appointmentId}`);
    const apptSnap = await get(apptRef);

    if (!apptSnap.exists()) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const apptData = apptSnap.val();
    if (apptData.customerId !== customerId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 2. Save review
    const reviewData = {
      customerId,
      customerName: req.user.name || "Customer",
      employeeId: apptData.employeeId,
      rating: Number(rating),
      comment: comment || "",
      appointmentId,
      date: Date.now(),
    };

    await set(ref(db, `salonandspa/reviews/${type}/${placeId}/${appointmentId}`), reviewData);

    // 3. Mark appointment as reviewed (optional but helpful)
    await update(apptRef, { isReviewed: true });

    // 4. Recalculate and update average rating on the place
    const reviewsRef = ref(db, `salonandspa/reviews/${type}/${placeId}`);
    const reviewsSnap = await get(reviewsRef);
    
    let avgRating = Number(rating); // Default to this rating if only one
    let totalReviews = 1;
    
    if (reviewsSnap.exists()) {
      const allReviews = Object.values(reviewsSnap.val());
      totalReviews = allReviews.length;
      const sumRatings = allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
      avgRating = Math.round((sumRatings / totalReviews) * 10) / 10; // Round to 1 decimal
    }
    
    // Update the place with the new average rating
    const placePath = `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`;
    await update(ref(db, placePath), { 
      rating: avgRating,
      totalReviews: totalReviews
    });

    return res.status(201).json({ 
      message: "Review added successfully", 
      review: reviewData,
      newAverageRating: avgRating,
      totalReviews: totalReviews
    });
  } catch (err) {
    console.error("ADD REVIEW ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getReviewsByPlace = async (req, res) => {
  try {
    const { type, placeId } = req.params;

    if (!type || !placeId) {
      return res.status(400).json({ error: "Missing type or placeId" });
    }

    const reviewsSnap = await get(ref(db, `salonandspa/reviews/${type}/${placeId}`));
    if (!reviewsSnap.exists()) {
      return res.json([]);
    }

    const reviews = Object.values(reviewsSnap.val());
    return res.json(reviews);
  } catch (err) {
    console.error("GET REVIEWS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


/**
 * GET OWNER REVIEWS (AGGREGATED)
 * Query: salonId
 */
export const getOwnerReviews = async (req, res) => {
  try {
    const { salonId } = req.query;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: "salonId is required",
      });
    }

    const reviewsRef = ref(db, `salonandspa/reviews/salon/${salonId}`);
    const snapshot = await get(reviewsRef);

    if (!snapshot.exists()) {
      return res.json({
        success: true,
        data: {
          avgRating: 0,
          totalReviews: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          thisWeekCount: 0,
          reviews: [],
        },
      });
    }

    const reviewsObj = snapshot.val();
    const reviews = Object.values(reviewsObj);

    let totalReviews = reviews.length;
    let ratingSum = 0;

    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    let thisWeekCount = 0;

    reviews.forEach((review) => {
      const rating = Number(review.rating || 0);

      if (rating >= 1 && rating <= 5) {
        ratingSum += rating;
        ratingBreakdown[rating] += 1;
      }

      if (review.date && review.date >= oneWeekAgo) {
        thisWeekCount += 1;
      }
    });

    const avgRating =
      totalReviews > 0
        ? Math.round((ratingSum / totalReviews) * 10) / 10
        : 0;

    return res.json({
      success: true,
      data: {
        avgRating,
        totalReviews,
        ratingBreakdown,
        thisWeekCount,
        reviews: reviews
          .sort((a, b) => b.date - a.date)
          .slice(0, 50), // latest 50 reviews
      },
    });
  } catch (error) {
    console.error("OWNER REVIEWS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch owner reviews",
    });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const { type, placeId } = req.body;
    const customerId = req.user.uid;

    if (!type || !placeId) {
      return res.status(400).json({ error: "Missing type or placeId" });
    }

    const favRef = ref(db, `salonandspa/customer/${customerId}/favorites/${placeId}`);
    const favSnap = await get(favRef);

    if (favSnap.exists()) {
      await remove(favRef);
      return res.json({ message: "Removed from favorites", isFavorite: false });
    } else {
      await set(favRef, {
        type,
        addedAt: Date.now(),
      });
      return res.json({ message: "Added to favorites", isFavorite: true });
    }
  } catch (err) {
    console.error("TOGGLE FAVORITE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getCustomerFavorites = async (req, res) => {
  try {
    const { customerId } = req.params;
    const authId = req.user.uid;

    if (authId !== customerId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const favRef = ref(db, `salonandspa/customer/${customerId}/favorites`);
    const favSnap = await get(favRef);

    if (!favSnap.exists()) {
      return res.json([]);
    }

    const favoritesData = favSnap.val(); // { placeId: { type, addedAt } }
    const result = [];

    for (const [placeId, data] of Object.entries(favoritesData)) {
      const type = data.type;
      const placePath = `salonandspa/${type === "salon" ? "salons" : "spas"}/${placeId}`;
      const placeSnap = await get(ref(db, placePath));

      if (placeSnap.exists()) {
        const item = placeSnap.val();
        result.push({
          id: placeId,
          type,
          name: item.name || "",
          branch: item.branch || "",
          address: item.address || "",
          image: item.image || "",
          rating: item.rating || 0,
          totalReviews: item.totalReviews || 0,
          services: item.services ? Object.values(item.services) : [],
        });
      }
    }

    return res.json(result);
  } catch (err) {
    console.error("GET FAVORITES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
