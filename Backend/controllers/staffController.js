import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "../config/firebase.js";

export const getStaffDetails = async (req, res) => {
    try {
        const employeeId = req.user.uid;
        const { salonIds, spaIds } = req.user;

        if (!employeeId) {
            return res.status(400).json({ error: "Employee ID not found in token" });
        }

        // ========== 1. FETCH EMPLOYEE PROFILE ==========
        const empRef = ref(db, `salonandspa/employees/${employeeId}`);
        const empSnap = await get(empRef);

        if (!empSnap.exists()) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const employeeData = empSnap.val();

        // ========== 2. FETCH SERVICES ==========
        const allServices = [];

        // Fetch services from salons
        if (salonIds && salonIds.length > 0) {
            for (const salonId of salonIds) {
                const empLinkRef = ref(db, `salonandspa/salons/${salonId}/employees/${employeeId}`);
                const empLinkSnap = await get(empLinkRef);

                if (empLinkSnap.exists()) {
                    const linkData = empLinkSnap.val();
                    const services = linkData.services || {};

                    for (const [serviceId, serviceData] of Object.entries(services)) {
                        allServices.push({
                            serviceId,
                            name: serviceData.name || "",
                            isActive: serviceData.isActive ?? true,
                            linkedAt: serviceData.linkedAt,
                            placeId: salonId,
                            placeType: "salon"
                        });
                    }
                }
            }
        }

        // Fetch services from spas
        if (spaIds && spaIds.length > 0) {
            for (const spaId of spaIds) {
                const empLinkRef = ref(db, `salonandspa/spas/${spaId}/employees/${employeeId}`);
                const empLinkSnap = await get(empLinkRef);

                if (empLinkSnap.exists()) {
                    const linkData = empLinkSnap.val();
                    const services = linkData.services || {};

                    for (const [serviceId, serviceData] of Object.entries(services)) {
                        allServices.push({
                            serviceId,
                            name: serviceData.name || "",
                            isActive: serviceData.isActive ?? true,
                            linkedAt: serviceData.linkedAt,
                            placeId: spaId,
                            placeType: "spa"
                        });
                    }
                }
            }
        }

        // ========== 3. FETCH APPOINTMENTS SUMMARY ==========
        const today = new Date();
        const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

        let todayAppointments = 0;
        let totalAppointments = 0;
        let upcomingAppointments = 0;
        let completedAppointments = 0;
        let cancelledAppointments = 0;

        // Fetch appointments from salons
        if (salonIds && salonIds.length > 0) {
            for (const salonId of salonIds) {
                const apptsRef = ref(db, `salonandspa/appointments/salon/${salonId}`);
                const apptsSnap = await get(apptsRef);

                if (apptsSnap.exists()) {
                    const appointments = Object.values(apptsSnap.val());
                    const myAppointments = appointments.filter(a => String(a.employeeId) === String(employeeId));

                    totalAppointments += myAppointments.length;
                    todayAppointments += myAppointments.filter(a => a.date === todayStr && a.status === "booked").length;
                    upcomingAppointments += myAppointments.filter(a => a.status === "booked").length;
                    completedAppointments += myAppointments.filter(a => a.status === "completed").length;
                    cancelledAppointments += myAppointments.filter(a => a.status === "cancelled").length;
                }
            }
        }

        // Fetch appointments from spas
        if (spaIds && spaIds.length > 0) {
            for (const spaId of spaIds) {
                const apptsRef = ref(db, `salonandspa/appointments/spa/${spaId}`);
                const apptsSnap = await get(apptsRef);

                if (apptsSnap.exists()) {
                    const appointments = Object.values(apptsSnap.val());
                    const myAppointments = appointments.filter(a => String(a.employeeId) === String(employeeId));

                    totalAppointments += myAppointments.length;
                    todayAppointments += myAppointments.filter(a => a.date === todayStr && a.status === "booked").length;
                    upcomingAppointments += myAppointments.filter(a => a.status === "booked").length;
                    completedAppointments += myAppointments.filter(a => a.status === "completed").length;
                    cancelledAppointments += myAppointments.filter(a => a.status === "cancelled").length;
                }
            }
        }

        // ========== 4. FETCH ATTENDANCE STATS ==========
        const attendanceRef = ref(db, `salonandspa/employees/${employeeId}/attendance`);
        const attendanceSnap = await get(attendanceRef);

        let attendanceStats = {
            totalDays: 0,
            present: 0,
            absent: 0,
            leave: 0,
            halfDay: 0
        };

        let todayAttendance = null;

        if (attendanceSnap.exists()) {
            const attendanceByDate = attendanceSnap.val();
            const attendanceRecords = Object.entries(attendanceByDate).map(([date, record]) => ({
                date,
                ...record
            }));

            // Calculate stats
            attendanceStats = {
                totalDays: attendanceRecords.length,
                present: attendanceRecords.filter(a => a.status === "present").length,
                absent: attendanceRecords.filter(a => a.status === "absent").length,
                leave: attendanceRecords.filter(a => a.status === "leave").length,
                halfDay: attendanceRecords.filter(a => a.status === "half-day").length,
            };

            // Get today's attendance
            if (attendanceByDate[todayStr]) {
                todayAttendance = attendanceByDate[todayStr];
            }
        }

        // ========== 5. RETURN COMPREHENSIVE RESPONSE ==========
        return res.status(200).json({
            success: true,
            employee: {
                employeeId: employeeData.empid,
                name: employeeData.name,
                phone: employeeData.phone,
                email: employeeData.email || "",
                role: employeeData.role,
                gender: employeeData.gender,
                image: employeeData.image || "",
                salary: employeeData.salary || 0,
                experience: employeeData.experience || "0",
                joiningDate: employeeData.joiningDate || (employeeData.createdAt ? new Date(employeeData.createdAt).toISOString().split('T')[0] : null),
                isActive: employeeData.isActive ?? true,
                ownerId: employeeData.ownerId,
                createdAt: employeeData.createdAt,
                createdBy: employeeData.createdBy,
                createdByRole: employeeData.createdByRole,
            },
            services: {
                total: allServices.length,
                list: allServices
            },
            appointments: {
                total: totalAppointments,
                today: todayAppointments,
                upcoming: upcomingAppointments,
                completed: completedAppointments,
                cancelled: cancelledAppointments
            },
            attendance: {
                stats: attendanceStats,
                today: todayAttendance || { status: "not_marked" }
            }
        });

    } catch (error) {
        console.error("GET STAFF DETAILS ERROR:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

/**
 * GET STAFF PROFILE (Simple)
 * Returns only employee profile details
 */
export const getStaffProfile = async (req, res) => {
    try {
        const employeeId = req.user.uid;

        if (!employeeId) {
            return res.status(400).json({ error: "Employee ID not found in token" });
        }

        const empRef = ref(db, `salonandspa/employees/${employeeId}`);
        const empSnap = await get(empRef);

        if (!empSnap.exists()) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const employeeData = empSnap.val();

        return res.status(200).json({
            success: true,
            employee: {
                employeeId: employeeData.empid,
                name: employeeData.name,
                phone: employeeData.phone,
                email: employeeData.email || "",
                role: employeeData.role,
                gender: employeeData.gender,
                image: employeeData.image || "",
                salary: employeeData.salary || 0,
                experience: employeeData.experience || "0",
                joiningDate: employeeData.joiningDate || (employeeData.createdAt ? new Date(employeeData.createdAt).toISOString().split('T')[0] : null),
                isActive: employeeData.isActive ?? true,
                ownerId: employeeData.ownerId,
                createdAt: employeeData.createdAt,
                createdBy: employeeData.createdBy,
                createdByRole: employeeData.createdByRole,
            }
        });

    } catch (error) {
        console.error("GET STAFF PROFILE ERROR:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

/**
 * GET STAFF SERVICES
 * Returns all services assigned to the logged-in staff member
 */
export const getStaffServices = async (req, res) => {
    try {
        const employeeId = req.user.uid;
        const { salonIds, spaIds } = req.user;

        if (!employeeId) {
            return res.status(400).json({ error: "Employee ID not found in token" });
        }

        const allServices = [];

        // Fetch services from all assigned salons
        if (salonIds && salonIds.length > 0) {
            for (const salonId of salonIds) {
                const empLinkRef = ref(db, `salonandspa/salons/${salonId}/employees/${employeeId}`);
                const empLinkSnap = await get(empLinkRef);

                if (empLinkSnap.exists()) {
                    const linkData = empLinkSnap.val();
                    const services = linkData.services || {};

                    for (const [serviceId, serviceData] of Object.entries(services)) {
                        allServices.push({
                            serviceId,
                            name: serviceData.name || "",
                            isActive: serviceData.isActive ?? true,
                            linkedAt: serviceData.linkedAt,
                            placeId: salonId,
                            placeType: "salon"
                        });
                    }
                }
            }
        }

        // Fetch services from all assigned spas
        if (spaIds && spaIds.length > 0) {
            for (const spaId of spaIds) {
                const empLinkRef = ref(db, `salonandspa/spas/${spaId}/employees/${employeeId}`);
                const empLinkSnap = await get(empLinkRef);

                if (empLinkSnap.exists()) {
                    const linkData = empLinkSnap.val();
                    const services = linkData.services || {};

                    for (const [serviceId, serviceData] of Object.entries(services)) {
                        allServices.push({
                            serviceId,
                            name: serviceData.name || "",
                            isActive: serviceData.isActive ?? true,
                            linkedAt: serviceData.linkedAt,
                            placeId: spaId,
                            placeType: "spa"
                        });
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            totalServices: allServices.length,
            services: allServices
        });

    } catch (error) {
        console.error("GET STAFF SERVICES ERROR:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

/**
 * GET STAFF APPOINTMENTS
 * Returns all appointments assigned to the logged-in staff member
 */
export const getStaffAppointments = async (req, res) => {
    try {
        const employeeId = req.user.uid;
        const { salonIds, spaIds } = req.user;
        const { status, startDate, endDate } = req.query;

        if (!employeeId) {
            return res.status(400).json({ error: "Employee ID not found in token" });
        }

        const allAppointments = [];

        // Helper function to format date for comparison
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
            return null;
        };

        // Fetch appointments from all assigned salons
        if (salonIds && salonIds.length > 0) {
            for (const salonId of salonIds) {
                const apptsRef = ref(db, `salonandspa/appointments/salon/${salonId}`);
                const apptsSnap = await get(apptsRef);

                if (apptsSnap.exists()) {
                    const appointments = apptsSnap.val();

                    for (const [appointmentId, appt] of Object.entries(appointments)) {
                        // Filter by employee ID
                        if (String(appt.employeeId) === String(employeeId)) {
                            // Apply status filter if provided
                            if (status && appt.status !== status) continue;

                            // Apply date range filter if provided
                            if (startDate || endDate) {
                                const apptDate = normalizeDateToDMY(appt.date);
                                const start = normalizeDateToDMY(startDate);
                                const end = normalizeDateToDMY(endDate);

                                if (start && apptDate < start) continue;
                                if (end && apptDate > end) continue;
                            }

                            allAppointments.push({
                                appointmentId,
                                ...appt,
                                placeId: salonId,
                                placeType: "salon"
                            });
                        }
                    }
                }
            }
        }

        // Fetch appointments from all assigned spas
        if (spaIds && spaIds.length > 0) {
            for (const spaId of spaIds) {
                const apptsRef = ref(db, `salonandspa/appointments/spa/${spaId}`);
                const apptsSnap = await get(apptsRef);

                if (apptsSnap.exists()) {
                    const appointments = apptsSnap.val();

                    for (const [appointmentId, appt] of Object.entries(appointments)) {
                        // Filter by employee ID
                        if (String(appt.employeeId) === String(employeeId)) {
                            // Apply status filter if provided
                            if (status && appt.status !== status) continue;

                            // Apply date range filter if provided
                            if (startDate || endDate) {
                                const apptDate = normalizeDateToDMY(appt.date);
                                const start = normalizeDateToDMY(startDate);
                                const end = normalizeDateToDMY(endDate);

                                if (start && apptDate < start) continue;
                                if (end && apptDate > end) continue;
                            }

                            allAppointments.push({
                                appointmentId,
                                ...appt,
                                placeId: spaId,
                                placeType: "spa"
                            });
                        }
                    }
                }
            }
        }

        // Sort by date and time (most recent first)
        allAppointments.sort((a, b) => {
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
            totalAppointments: allAppointments.length,
            appointments: allAppointments
        });

    } catch (error) {
        console.error("GET STAFF APPOINTMENTS ERROR:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

/**
 * GET STAFF ATTENDANCE
 * Returns attendance records for the logged-in staff member
 * FIXED: Now fetches from global employee path (salonandspa/employees/{employeeId}/attendance)
 */
export const getStaffAttendance = async (req, res) => {
    try {
        const employeeId = req.user.uid;
        const { startDate, endDate, month, year } = req.query;

        if (!employeeId) {
            return res.status(400).json({ error: "Employee ID not found in token" });
        }

        // Helper function to check if date is in range
        const isDateInRange = (dateStr) => {
            if (!dateStr) return false;

            // If month and year provided, check if date is in that month
            if (month && year) {
                const [d, m, y] = dateStr.split("-");
                return m === month && y === year;
            }

            // If date range provided
            if (startDate || endDate) {
                if (startDate && dateStr < startDate) return false;
                if (endDate && dateStr > endDate) return false;
            }

            return true;
        };

        // Fetch attendance from global employee path (correct location)
        const attendanceRef = ref(db, `salonandspa/employees/${employeeId}/attendance`);
        const attendanceSnap = await get(attendanceRef);

        const allAttendance = [];

        if (attendanceSnap.exists()) {
            const attendanceByDate = attendanceSnap.val();

            for (const [date, record] of Object.entries(attendanceByDate)) {
                if (!isDateInRange(date)) continue;

                allAttendance.push({
                    date,
                    ...record
                });
            }
        }

        // Sort by date (most recent first)
        allAttendance.sort((a, b) => {
            const [d1, m1, y1] = a.date.split("-").map(Number);
            const [d2, m2, y2] = b.date.split("-").map(Number);
            const date1 = new Date(y1, m1 - 1, d1);
            const date2 = new Date(y2, m2 - 1, d2);
            return date2 - date1;
        });

        // Calculate statistics
        const stats = {
            totalDays: allAttendance.length,
            present: allAttendance.filter(a => a.status === "present").length,
            absent: allAttendance.filter(a => a.status === "absent").length,
            leave: allAttendance.filter(a => a.status === "leave").length,
            halfDay: allAttendance.filter(a => a.status === "half-day").length,
        };

        return res.status(200).json({
            success: true,
            stats,
            totalRecords: allAttendance.length,
            attendance: allAttendance
        });

    } catch (error) {
        console.error("GET STAFF ATTENDANCE ERROR:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

//Get each employee salary of a salon
export const getEachEmployeeEarning = async (req, res) => {
    try {
        const { salonId } = req.params;

        if (!salonId) {
            return res.status(400).json({ message: "salonId is required" });
        }

        const snapshot = await get(ref(db, "salonandspa/employees"));

        if (!snapshot.exists()) {
            return res.status(200).json({ salonId, employees: [] });
        }

        const employeesData = snapshot.val();

        const employees = Object.values(employeesData)
            .filter(emp => emp.salonid1 === salonId)
            .map(emp => ({
                employeeId: emp.empid,
                name: emp.name,
                role: emp.role,
                salary: Number(emp.salary || 0),
            }));

        res.status(200).json({
            salonId,
            totalEmployees: employees.length,
            employees,
        });

    } catch (error) {
        console.error("Get Each Employee Earning Error:", error);
        res.status(500).json({ message: "Failed to fetch employee earnings" });
    }
};


/*
====================================================
2️⃣ Get salary of single employee by ID
====================================================
*/
export const getEmployeeSalaryById = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ message: "employeeId is required" });
        }

        const snapshot = await get(
            ref(db, `salonandspa/employees/${employeeId}`)
        );

        if (!snapshot.exists()) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const emp = snapshot.val();

        res.status(200).json({
            employeeId,
            name: emp.name,
            role: emp.role,
            salary: Number(emp.salary || 0),
        });

    } catch (error) {
        console.error("Get Employee Salary Error:", error);
        res.status(500).json({ message: "Failed to fetch employee salary" });
    }
};


/*
====================================================
3️⃣ Get full earning of employee by employeeId
(salary + bookings + service earning)
====================================================
*/
export const getEmployeeFullEarning = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ message: "employeeId is required" });
        }

        // Get employee
        const empSnap = await get(ref(db, `salonandspa/employees/${employeeId}`));

        if (!empSnap.exists()) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const emp = empSnap.val();
        const salary = Number(emp.salary || 0);

        // Get all salon appointments
        const appSnap = await get(ref(db, "salonandspa/appointments/salon"));

        let totalBookings = 0;
        let totalEarning = 0;

        if (appSnap.exists()) {
            const salons = appSnap.val();

            Object.values(salons).forEach((appointments) => {
                Object.values(appointments).forEach((app) => {
                    if (app.employeeId === employeeId && app.status === "booked") {
                        totalBookings++;
                        totalEarning += Number(app.totalAmount || 0);
                    }
                });
            });
        }

        res.status(200).json({
            employeeId,
            name: emp.name,
            role: emp.role,
            salary,
            totalBookings,
            totalServiceEarning: totalEarning,
            totalOverallEarning: salary + totalEarning,
        });

    } catch (error) {
        console.error("Employee Full Earning Error:", error);
        res.status(500).json({ message: "Failed to fetch employee earnings" });
    }
};


/*
====================================================
4️⃣ SECURE → Get logged-in employee own earning
(employeeId from JWT token)
====================================================
*/
export const getMyFullEarning = async (req, res) => {
    try {
        const employeeId = req.user?.uid;

        if (!employeeId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Get employee
        const empSnap = await get(ref(db, `salonandspa/employees/${employeeId}`));

        if (!empSnap.exists()) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const emp = empSnap.val();
        const salary = Number(emp.salary || 0);

        // Get appointments
        const appSnap = await get(ref(db, "salonandspa/appointments/salon"));

        let totalBookings = 0;
        let totalEarning = 0;

        if (appSnap.exists()) {
            const salons = appSnap.val();

            Object.values(salons).forEach((appointments) => {
                Object.values(appointments).forEach((app) => {
                    if (app.employeeId === employeeId && app.status === "booked") {
                        totalBookings++;
                        totalEarning += Number(app.totalAmount || 0);
                    }
                });
            });
        }

        res.status(200).json({
            employeeId,
            name: emp.name,
            role: emp.role,
            salary,
            totalBookings,
            totalServiceEarning: totalEarning,
            totalOverallEarning: salary + totalEarning,
        });

    } catch (error) {
        console.error("Get My Earning Error:", error);
        res.status(500).json({ message: "Failed to fetch earnings" });
    }
};
/*
====================================================
🔔 Get logged-in employee upcoming appointments
(SECURE → employeeId from JWT token)
====================================================
*/
export const getMyUpcomingAppointments = async (req, res) => {
    try {
        const employeeId = req.user?.uid;
        const salonIds = req.user?.salonIds || [];
        const spaIds = req.user?.spaIds || [];

        if (!employeeId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        let upcomingAppointments = [];
        const now = new Date();
        const NOTIFY_BEFORE_MINUTES = 1440; // 24 hours

        // Helper to parse date string (DD-MM-YYYY or YYYY-MM-DD)
        const parseDateTime = (dateStr, timeStr) => {
            if (!dateStr || !timeStr) return null;

            const parts = dateStr.split("-");
            let d, m, y;

            // Check if YYYY-MM-DD
            if (parts[0].length === 4) {
                y = parts[0];
                m = parts[1];
                d = parts[2];
            }
            // Check if DD-MM-YYYY
            else if (parts[2].length === 4) {
                d = parts[0];
                m = parts[1];
                y = parts[2];
            } else {
                return null; // Invalid format
            }

            return new Date(`${y}-${m}-${d}T${timeStr}:00`);
        };

        // 1️⃣ Fetch SALON appointments (only for assigned salons)
        if (salonIds.length > 0) {
            for (const salonId of salonIds) {
                const appSnap = await get(ref(db, `salonandspa/appointments/salon/${salonId}`));

                if (appSnap.exists()) {
                    const appointments = appSnap.val();
                    Object.values(appointments).forEach((app) => {
                        if (String(app.employeeId) !== String(employeeId)) return;
                        if (app.status !== "booked") return;

                        const appointmentDateTime = parseDateTime(app.date, app.startTime);
                        if (!appointmentDateTime) return;

                        const diffInMinutes = (appointmentDateTime - now) / (1000 * 60);

                        // 🔔 Notification-ready condition (Future & within 24h)
                        if (diffInMinutes > 0 && diffInMinutes <= NOTIFY_BEFORE_MINUTES) {
                            upcomingAppointments.push({
                                appointmentId: app.appointmentId,
                                placeId: salonId,
                                placeType: "salon",
                                date: app.date,
                                startTime: app.startTime,
                                minutesLeft: Math.floor(diffInMinutes),
                                totalAmount: Number(app.totalAmount || 0),
                                type: app.type || "salon_service",
                                customerName: app.customerName || "Unknown Customer" // useful for notification
                            });
                        }
                    });
                }
            }
        }

        // 2️⃣ Fetch SPA appointments (only for assigned spas)
        if (spaIds.length > 0) {
            for (const spaId of spaIds) {
                const appSnap = await get(ref(db, `salonandspa/appointments/spa/${spaId}`));

                if (appSnap.exists()) {
                    const appointments = appSnap.val();
                    Object.values(appointments).forEach((app) => {
                        if (String(app.employeeId) !== String(employeeId)) return;
                        if (app.status !== "booked") return;

                        const appointmentDateTime = parseDateTime(app.date, app.startTime);
                        if (!appointmentDateTime) return;

                        const diffInMinutes = (appointmentDateTime - now) / (1000 * 60);

                        if (diffInMinutes > 0 && diffInMinutes <= NOTIFY_BEFORE_MINUTES) {
                            upcomingAppointments.push({
                                appointmentId: app.appointmentId,
                                placeId: spaId,
                                placeType: "spa",
                                date: app.date,
                                startTime: app.startTime,
                                minutesLeft: Math.floor(diffInMinutes),
                                totalAmount: Number(app.totalAmount || 0),
                                type: app.type || "spa_service",
                                customerName: app.customerName || "Unknown Customer"
                            });
                        }
                    });
                }
            }
        }

        // Sort by time (soonest first)
        upcomingAppointments.sort((a, b) => a.minutesLeft - b.minutesLeft);

        // 3️⃣ Send response
        res.status(200).json({
            success: true,
            employeeId,
            totalUpcomingAppointments: upcomingAppointments.length,
            upcomingAppointments,
        });

    } catch (error) {
        console.error("Get Upcoming Appointments Error:", error);
        res.status(500).json({ message: "Failed to fetch upcoming appointments" });
    }
};
