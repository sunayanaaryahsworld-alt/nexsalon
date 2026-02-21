import express from "express";
import {
    markAttendance,
    getDailyAttendance,
    getEmployeeAttendance
} from "../controllers/attendanceControllers.js";
import { verifyToken, verifyRole } from "../middlerware/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/attendance/:type/:placeId/mark
 * Mark or update attendance for multiple staff members
 * Access: Admin, Master Employee (Receptionist)
 */
router.post(
    "/:type/:placeId/mark",
    verifyToken,
    verifyRole(["admin", "employee"]),
    markAttendance
);

/**
 * GET /api/attendance/:type/:placeId/daily/:date
 * Get attendance records for all staff on a specific date
 * Access: Admin, Master Employee
 */
router.get(
    "/:type/:placeId/daily/:date",
    verifyToken,
    verifyRole(["admin", "employee"]),
    getDailyAttendance
);

/**
 * GET /api/attendance/:type/:placeId/employee/:employeeId
 * Get attendance history for a specific employee
 * Access: Admin, Master Employee, Self
 */
router.get(
    "/:type/:placeId/employee/:employeeId",
    verifyToken,
    getEmployeeAttendance
);

export default router;
