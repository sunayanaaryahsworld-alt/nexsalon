import express from "express";
import {
  cancelAppointment, getEmployeeFullPlaceDetails, getBookedSlotsByDate, getAllPlans, createWalkinAppointment, getAppointmentsByPlace, getEnrichedAppointments, addServiceToEmployee, rescheduleAppointment
  , addService, updateService, toggleServiceStatus, getServices, getSalonServicesForMasterEmployee, addEmployeeByMasterEmployee, updateEmployeeByMasterEmployee, getEmployeeByMasterEmployee, deactivateEmployeeByMasterEmployee, reactivateEmployeeByMasterEmployee, getEmployeesForMaster,
  getOrInitReceptionistPermissions, getOrInitStaffPermissions
} from "../controllers/employeeControllers.js";
import { verifyRole, verifyToken } from "../middlerware/authMiddleware.js";
import { getClients } from "../controllers/employeeControllers.js";
import { uploadImage } from "../middlerware/uploadSalonImage.js";


const router = express.Router();

// router.get("/",)

router.get(
  "/appointments/:type/:placeId",
  getAppointmentsByPlace
);




router.post(
  "/appointments/walkin",
  verifyToken,
  createWalkinAppointment
);

router.get('/getallappointments/:type/:placeId', getEnrichedAppointments);

router.put(
  "/appointments/reschedule",
  verifyToken,
  rescheduleAppointment
);

router.delete(
  "/:type/:placeId/appointments/:appointmentId",
  verifyToken,
  cancelAppointment
);


router.post("/add-service", addServiceToEmployee);

router.get(
  "/slots/:type/:placeId",
  verifyToken,
  getBookedSlotsByDate
);

router.get(
  "/details",
  verifyToken,
  getEmployeeFullPlaceDetails
);

// 👤 Add new staff by master employee (receptionist)
router.post(
  "/employee/add",
  verifyToken,
  uploadImage.single("image"),
  addEmployeeByMasterEmployee
);

// 👥 Get all employees for master employee (active & inactive)
router.get(
  "/getemployees/:type/:placeId",
  verifyToken,
  getEmployeesForMaster
);

// 👁️ Get single employee by master employee
router.get(
  "/employee/:employeeId",
  verifyToken,
  getEmployeeByMasterEmployee
);

// ✏️ Update staff by master employee (receptionist)
router.put(
  "/employee/:employeeId",
  verifyToken,
  uploadImage.single("image"),
  updateEmployeeByMasterEmployee
);

// 🔴 Deactivate staff by master employee (receptionist)
router.put(
  "/employee/:employeeId/deactivate",
  verifyToken,
  deactivateEmployeeByMasterEmployee
);

// 🟢 Reactivate staff by master employee (receptionist)
router.put(
  "/employee/:employeeId/reactivate",
  verifyToken,
  reactivateEmployeeByMasterEmployee
);

router.get("/:type/:placeId", getClients);

///
router.get(
  "/services",
  verifyToken,
  getServices
);

// Add a new service
router.post(
  "/addservice",
  verifyToken,
  uploadImage.single("image"),
  addService
);

// Update an existing service
router.put(
  "/services/:serviceId",
  verifyToken,
  uploadImage.single("image"),
  updateService
);

// Toggle service status (Active/Inactive)
router.patch(
  "/services/:serviceId/toggle",
  verifyToken,
  toggleServiceStatus
);

router.get("/plans", getAllPlans);

router.get(
  "/services/:type/:placeId/master",
  verifyToken,
  getSalonServicesForMasterEmployee
);


router.get(
  "/permissions/receptionist/:type/:placeId/get-or-init",
  verifyToken,
  getOrInitReceptionistPermissions
);

router.get(
  "/permissions/staff/:type/:placeId/get-or-init" ,
  verifyToken,
  getOrInitStaffPermissions
);

export default router;
