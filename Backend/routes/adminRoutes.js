import express from "express";
import {
  activateEmployee,
  addEmployee,
  addSalonService,
  createAfterPayment,
  deactivateEmployee,
  getAdminSubscriptions,
  getSingleSubscription,
  getPlaceEmployees,
  getSalonServices,
  setMasterEmployee,
  removeMasterEmployee,
  updateEmployee,
  updateSalonService,
  toggleSalonService,
  assignEmployeeToSalonAndAddServices,
  viewPlaceDetails,
  getAppointmentsByPlace,
  viewEmployees,
  salonDashboardCounts,
  getCustomerVisitAnalytics,
  createBranch,
  updateAdminProfile,
  addEmployeeAndAssignServices,
  updatePlaceDetails,
  updateBranch,
  getEmployee,
  updateEmployeeServices,
  deactivateStaffNew,
  reactivateStaffNew,
  updateTimings,
  saveRole,
  getRoles,
  getRoleById,
  initPlacePermissions,
  getPlacePermissions,
  updatePlaceRolePermissions,
  getOrInitPlaceRolePermissions,
  getAllPlaces,
  getPopularServices,
  addServiceCategory,
  getServiceCategories,
  updateServiceCategory,
  deleteServiceCategory
} from "../controllers/adminControllers.js";
import { verifyToken, verifyRole } from "../middlerware/authMiddleware.js";
import { uploadImage } from "../middlerware/uploadSalonImage.js";
import {
  getReceptionistsBySalon,
  createReceptionist
} from "../controllers/adminControllers.js";




const router = express.Router();

// Only ADMIN and SUPERADMIN can create salon/spa after payment
router.post(
  "/create-after-payment",
  verifyToken,
  verifyRole(["admin"]),
  createAfterPayment
);


router.get(
  "/subscriptions",
  verifyToken,
  getAdminSubscriptions
);

// ✅ ADDED FOR RECEPTIONIST - Get single salon/spa subscription
router.get(
  "/subscription/:salonId",
  verifyToken,
  getSingleSubscription
);

router.put(
  "/employee/:employeeId",
  verifyToken,
  verifyRole(["admin"]),
  updateEmployee
);

router.put(
  "/:type/:placeId",
  verifyToken,
  verifyRole(["admin"]),
  uploadImage.single("image"),
  updatePlaceDetails
);

router.post(
  "/view-place-details",
  verifyToken,
  verifyRole(["admin"]),
  viewPlaceDetails
);

router.post(
  "/employee",
  verifyToken,
  verifyRole(["admin"]),
  addEmployee
);




router.get(
  "/:type/employees/:placeId",
  verifyToken,
  verifyRole(["admin", "employee"]),
  getPlaceEmployees
);


router.put(
  "/salon/:salonId/employee/:employeeId/deactivate",
  verifyToken,
  verifyRole(["admin"]),
  deactivateEmployee
);

router.put(
  "/:type/:placeId/employee/:employeeId/deactivate-new",
  verifyToken,
  verifyRole(["admin"]),
  deactivateStaffNew
);

router.put(
  "/:type/:placeId/employee/:employeeId/reactivate-new",
  verifyToken,
  verifyRole(["admin"]),
  reactivateStaffNew
);

router.patch(
  "/superadmin/salon/:salonId/employee/:employeeId/activate",
  verifyToken,
  verifyRole(["superadmin"]),
  activateEmployee
);

router.patch(
  "/:type/:placeId/master-employee/:employeeId",
  verifyToken,
  verifyRole(['admin']),
  setMasterEmployee
);

router.delete(
  "/:type/:placeId/master-employee",
  verifyToken,
  verifyRole(['admin']),
  removeMasterEmployee
);


router.post(
  "/salon/:salonId/services",
  verifyToken,
  verifyRole(["admin"]),
  uploadImage.single("image"),
  addSalonService
);

router.put(
  "/salon/:salonId/services/:serviceId",
  verifyToken,
  verifyRole(["admin"]),
  uploadImage.single("image"),
  updateSalonService
);

router.get(
  "/salon/:salonId/services",
  verifyToken,
  verifyRole(["admin"]),
  getSalonServices
);


router.post(
  "/employees/assign-salon-services",
  verifyToken,
  verifyRole(['admin']),
  assignEmployeeToSalonAndAddServices
);

router.get(
  "/viewemployees",
  verifyToken,
  verifyRole(["admin"]),
  viewEmployees
);


router.patch(
  "/salon/:salonId/services/:serviceId/toggle",
  verifyToken,
  verifyRole(["admin"]),
  toggleSalonService
);


router.get(
  "/appointments/:type/:placeId",
  verifyToken,
  verifyRole(['admin']),
  getAppointmentsByPlace
);

router.get("/:salonId/counts", verifyToken, verifyRole(['admin']), salonDashboardCounts);



router.get(
  "/getcustomers/:type/:placeId",
  verifyToken,
  verifyRole(['admin']),
  getCustomerVisitAnalytics
);


router.post(
  "/create-branch",
  verifyToken,
  verifyRole(["admin"]),
  uploadImage.single("image"),
  createBranch
);



router.put(
  "/update-profile",
  verifyToken,
  uploadImage.single("image"),   // 🔥 MUST BE BEFORE CONTROLLER
  updateAdminProfile
);

router.post(
  "/employee/assign-with-image",
  uploadImage.single("image"),
  verifyToken,
  verifyRole(["admin"]),// OPTIONAL
  addEmployeeAndAssignServices
);

router.put(
  "/branch/:type/:branchId",
  verifyToken,
  verifyRole(["admin"]),
  uploadImage.single("image"),
  updateBranch
);

// Timings Update
router.put(
  "/branch/:type/:placeId/timings",
  verifyToken,
  verifyRole(["admin"]),
  updateTimings
);


// 🔥 Master Staff (Receptionists)
router.get(
  "/salon/receptionists/:salonId",
  verifyToken,
  getReceptionistsBySalon
);

// 🔥 Create Master Staff (Receptionist)
router.post(
  "/salon/receptionists",
  verifyToken,
  verifyRole(["admin"]),
  createReceptionist
);


// Get Single Employee (Data & Services)
router.get(
  "/employee/:employeeId",
  verifyToken,
  verifyRole(["admin"]),
  getEmployee
);

// Update Employee Services
router.put(
  "/employee/:employeeId/services",
  verifyToken,
  verifyRole(["admin"]),
  updateEmployeeServices
);
router.get(
  "/allplaces",
  verifyToken,
  getAllPlaces
);



/* =====================================================
   ROLES MANAGEMENT
   ===================================================== */

// Create or Update Role
router.post(
  "/roles",
  verifyToken,
  verifyRole(["admin"]),
  saveRole
);

// Get All Roles (Roles Page)
router.get(
  "/roles",
  verifyToken,
  verifyRole(["admin"]),
  getRoles
);
router.get(
  "/popular-services/:type/:placeId",
  verifyToken,
  verifyRole(["admin"]),
  getPopularServices
);

// Get Single Role (Edit Role)
router.get(
  "/roles/:roleId",
  verifyToken,
  verifyRole(["admin"]),
  getRoleById
);

router.post(
  "/place/:type/:placeId/permissions/init",
  verifyToken,
  verifyRole(["admin"]),
  initPlacePermissions
);

router.get(
  "/place/:type/:placeId/permissions",
  verifyToken,
  verifyRole(["admin"]),
  getPlacePermissions
);

router.put(
  "/place/:type/:placeId/permissions/:roleId",
  verifyToken,
  verifyRole(["admin"]),
  updatePlaceRolePermissions
);

/* =====================================================
   SERVICE CATEGORIES MANAGEMENT
   ===================================================== */

router.post(
  "/:type/:placeId/service-categories",
  verifyToken,
  verifyRole(["admin", "employee"]),
  uploadImage.single("image"),
  addServiceCategory
);

router.get(
  "/:type/:placeId/service-categories",
  verifyToken,
  verifyRole(["admin", "employee"]),
  getServiceCategories
);

router.put(
  "/:type/:placeId/service-categories/:categoryId",
  verifyToken,
  verifyRole(["admin", "employee"]),
  uploadImage.single("image"),
  updateServiceCategory
);

router.delete(
  "/:type/:placeId/service-categories/:categoryId",
  verifyToken,
  verifyRole(["admin", "employee"]),
  deleteServiceCategory
);

router.get(
  "/place/:type/:placeId/permissions/:roleId/get-or-init",
  verifyToken,
  verifyRole(["admin","employee"]),
  getOrInitPlaceRolePermissions
);

export default router;
