import { ref, get, update } from "firebase/database";
import { db } from "../config/firebase.js";



export const markAttendance = async (req, res) => {
    try {
        const markedBy = req.user.uid;
        const { type, placeId } = req.params;
        const { date, records } = req.body;

        /* ---------------- VALIDATION ---------------- */
        if (!placeId || !date || !records || !Array.isArray(records)) {
            return res.status(400).json({
                error: "placeId, date, and records array are required"
            });
        }

        if (records.length === 0) {
            return res.status(400).json({
                error: "At least one attendance record is required"
            });
        }

        /* ---------------- DYNAMIC BASE PATH ---------------- */
        const basePath = type === "spa"
            ? `salonandspa/spas/${placeId}`
            : `salonandspa/salons/${placeId}`;



        /* ---------------- VERIFY PLACE EXISTS ---------------- */
        const placeRef = ref(db, basePath);
        const placeSnap = await get(placeRef);

        if (!placeSnap.exists()) {
            return res.status(404).json({
                error: `${type} not found`
            });
        }

        const placeData = placeSnap.val();

        /* ---------------- OWNERSHIP CHECK ---------------- */
        if (placeData.ownerId !== markedBy && placeData.masterEmployeeId !== markedBy) {
            return res.status(403).json({
                error: "Unauthorized. You can only mark attendance for your own business"
            });
        }

        /* ---------------- PROCESS ATTENDANCE RECORDS ---------------- */
        const timestamp = new Date().toISOString();
        const updates = {};
        let recordsProcessed = 0;
        let recordsSkipped = 0;

        for (const record of records) {

            const { employeeId, status, checkIn, checkOut, leaveType, remarks } = record;

            /* 🔍 Validate required fields */
            if (!employeeId || !status) {
                recordsSkipped++;
                continue;
            }


            if (status === "leave" && !leaveType) {
                recordsSkipped++;
                continue;
            }


            const globalEmployeeRef = ref(db, `salonandspa/employees/${employeeId}`);
            const employeeSnap = await get(globalEmployeeRef);

            if (!employeeSnap.exists()) {
                // Let's verify link existence validation
                const linkRef = ref(db, `${basePath}/employees/${employeeId}`);
                const linkSnap = await get(linkRef);

                if (!linkSnap.exists()) {
                    recordsSkipped++;
                    continue;
                }
            }

            const employeeData = employeeSnap.exists() ? employeeSnap.val() : {};
            const employeeName = employeeData.name || employeeData.fullName || "Unknown Employee";

            // Store attendance in global employee path
            const attendancePath = `salonandspa/employees/${employeeId}/attendance/${date}`;

            const attendanceData = {
                date,
                employeeId,
                employeeName,
                status,
                checkIn: checkIn || null,
                checkOut: checkOut || null,
                leaveType: leaveType || null,
                remarks: remarks || "",
                markedBy,
                markedAt: timestamp,
                updatedAt: timestamp
            };

            updates[attendancePath] = attendanceData;
            recordsProcessed++;
        }

        /* ---------------- BATCH UPDATE TO FIREBASE ---------------- */

        if (recordsProcessed > 0) {
            await update(ref(db), updates);
        } else {
            return res.status(400).json({
                error: "No records were processed. Please check if employees exist.",
                recordsSkipped
            });
        }

        /* ---------------- RESPONSE ---------------- */
        return res.status(200).json({
            message: `Attendance marked for ${recordsProcessed} employees`,
            recordsProcessed,
            recordsSkipped,
            date
        });

    } catch (err) {
        return res.status(500).json({
            error: "Server error while marking attendance"
        });
    }
};

export const getDailyAttendance = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { type, placeId, date } = req.params;

        /* ---------------- VALIDATION ---------------- */
        if (!placeId || !date) {
            return res.status(400).json({
                error: "placeId and date are required"
            });
        }

        if (!["salon", "spa"].includes(type)) {
            return res.status(400).json({
                error: "Invalid type. Must be salon or spa"
            });
        }

        /* ---------------- DYNAMIC BASE PATH ---------------- */
        const basePath = type === "spa"
            ? `salonandspa/spas/${placeId}`
            : `salonandspa/salons/${placeId}`;

        /* ---------------- VERIFY PLACE EXISTS ---------------- */
        const placeRef = ref(db, basePath);
        const placeSnap = await get(placeRef);

        if (!placeSnap.exists()) {
            return res.status(404).json({
                error: `${type} not found`
            });
        }

        const placeData = placeSnap.val();

        /* ---------------- OWNERSHIP CHECK ---------------- */
        if (placeData.ownerId !== userId && placeData.masterEmployeeId !== userId) {
            return res.status(403).json({
                error: "Unauthorized. You can only view attendance for your own business"
            });
        }

        /* ---------------- GET ALL EMPLOYEES ---------------- */
        const employeesRef = ref(db, `${basePath}/employees`);
        const employeesSnap = await get(employeesRef);

        const records = [];

        if (employeesSnap.exists()) {

            /* 🔄 Iterate through each employee */
            const promises = [];

            employeesSnap.forEach(employeeChild => {
                const employeeId = employeeChild.key;

                /* 📖 Get attendance from global employee path */
                const attendancePath = `salonandspa/employees/${employeeId}/attendance/${date}`;

                const attendanceRef = ref(db, attendancePath);

                promises.push(
                    get(attendanceRef).then(attendanceSnap => {
                        if (attendanceSnap.exists()) {
                            records.push({
                                employeeId,
                                ...attendanceSnap.val()
                            });
                        }
                    })
                );
            });

            /* ⏳ Wait for all attendance reads to complete */
            await Promise.all(promises);
        }

        /* ---------------- RESPONSE ---------------- */
        return res.status(200).json({
            date,
            totalRecords: records.length,
            records
        });

    } catch (err) {
        return res.status(500).json({
            error: "Server error while fetching attendance"
        });
    }
};

export const getEmployeeAttendance = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { type, placeId, employeeId } = req.params;

        /* ---------------- VALIDATION ---------------- */
        if (!employeeId || !placeId) {
            return res.status(400).json({
                error: "employeeId and placeId are required"
            });
        }

        if (!["salon", "spa"].includes(type)) {
            return res.status(400).json({
                error: "Invalid type. Must be salon or spa"
            });
        }

        /* ---------------- DYNAMIC BASE PATH ---------------- */
        const basePath = type === "spa"
            ? `salonandspa/spas/${placeId}`
            : `salonandspa/salons/${placeId}`;

        /* ---------------- VERIFY PLACE EXISTS ---------------- */
        const placeRef = ref(db, basePath);
        const placeSnap = await get(placeRef);

        if (!placeSnap.exists()) {
            return res.status(404).json({
                error: `${type} not found`
            });
        }

        const placeData = placeSnap.val();

        /* ---------------- OWNERSHIP CHECK ---------------- */
        if (placeData.ownerId !== userId) {
            return res.status(403).json({
                error: "Unauthorized"
            });
        }

        /* ---------------- GET EMPLOYEE ATTENDANCE ---------------- */
        // Fetch from global employee path
        const attendanceRef = ref(db, `salonandspa/employees/${employeeId}/attendance`);
        const attendanceSnap = await get(attendanceRef);

        const records = [];

        if (attendanceSnap.exists()) {
            const allAttendance = attendanceSnap.val();

            Object.keys(allAttendance).forEach(date => {
                records.push({
                    date,
                    ...allAttendance[date]
                });
            });

            /* 📅 Sort by date (newest first) */
            records.sort((a, b) => {
                const [dayA, monthA, yearA] = a.date.split('-');
                const [dayB, monthB, yearB] = b.date.split('-');
                const dateA = new Date(`${yearA}-${monthA}-${dayA}`);
                const dateB = new Date(`${yearB}-${monthB}-${dayB}`);
                return dateB - dateA;
            });
        }

        /* ---------------- RESPONSE ---------------- */
        return res.status(200).json({
            employeeId,
            totalRecords: records.length,
            records
        });

    } catch (err) {
        return res.status(500).json({
            error: "Server error while fetching employee attendance"
        });
    }
};
