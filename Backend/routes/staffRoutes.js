import express from "express";
import {
    getStaffProfile,
    getStaffDetails,
    getStaffServices,
    getStaffAppointments,
    getStaffAttendance,
    getEachEmployeeEarning,
    getEmployeeSalaryById,
    getEmployeeFullEarning,
    getMyFullEarning,
    getMyUpcomingAppointments
} from "../controllers/staffController.js";
import { verifyToken, verifyRole } from "../middlerware/authMiddleware.js";
import authMiddleware from "../middlerware/authMiddleware.js";

const router = express.Router();

/**
 * All routes require employee authentication
 * Token must contain: uid (empid), phone, employeeType, role, ownerId, salonIds, spaIds
 */

// GET Staff Profile - Returns only employee profile
router.get("/profile", verifyToken, verifyRole(["employee"]), getStaffProfile);

// GET Staff Details - Returns COMPLETE staff information (profile + services + appointments + attendance stats)
// This is the MAIN endpoint for staff dashboard
router.get("/details", verifyToken, verifyRole(["employee"]), getStaffDetails);

// GET Staff Services - Returns all assigned services
router.get("/services", verifyToken, verifyRole(["employee"]), getStaffServices);

// GET Staff Appointments - Returns all appointments with optional filters
// Query params: status, startDate, endDate
router.get("/appointments", verifyToken, verifyRole(["employee"]), getStaffAppointments);

// GET Staff Attendance - Returns day-wise attendance records with optional filters
// Query params: startDate, endDate, month, year
router.get("/attendance", verifyToken, verifyRole(["employee"]), getStaffAttendance);

/*
====================================================
1️⃣ Get all employees salary of a salon
GET /api/staff-earnings-list/:salonId
====================================================
*/
router.get("/staff-earnings-list/:salonId", getEachEmployeeEarning);


/*
====================================================
2️⃣ Get salary of ONE employee by employeeId
GET /api/employee-salary/:employeeId
====================================================
*/
router.get("/employee-salary/:employeeId", getEmployeeSalaryById);


/*
====================================================
3️⃣ Get full earning of employee by employeeId
(salary + bookings + service earning)
GET /api/employee-full-earning/:employeeId
====================================================
*/
router.get("/employee-full-earning/:employeeId", getEmployeeFullEarning);


/*
====================================================
4️⃣ SECURE → Get logged-in employee own earning
Token required
GET /api/employee/my-earning
====================================================
*/
router.get("/employee/my-earning", authMiddleware, getMyFullEarning);

router.get(
  "/employee/my-upcoming-appointments",
  authMiddleware,
  getMyUpcomingAppointments
);

export default router;
