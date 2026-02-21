import express from "express";
import {
    updateSpaDetails,
    viewSpaDetails,
    addSpaService,
    updateSpaService,
    getSpaServices,
    deleteSpaService,
    toggleSpaService,
    getSalonCustomers
} from "../controllers/adminSpaControllers.js";
import { verifyToken, verifyRole } from "../middlerware/authMiddleware.js";
import { uploadSpaImage } from "../middlerware/uploadSpaImage.js";
import { uploadSpaServiceImage } from "../middlerware/uploadSpaservicesImage.js";

const router = express.Router();

router.put(
  "/spa/:spaId",
  verifyToken,
  verifyRole(["admin"]),
  uploadSpaImage.single("image"),
  updateSpaDetails
);

router.get(
  "/spa/:spaId",
  verifyToken,
  verifyRole(["admin"]),
  viewSpaDetails
);

// router.post(
//   "/spa/employee/:spaId",
//   verifyToken,
//   verifyRole(["admin"]),
//   addEmployee
// );

// router.put(
//   "/employee/:employeeId",
//   verifyToken,
//   verifyRole(["admin"]),
//   updateEmployee
// );


// router.get(
//   "/salon/employees/:salonId",
//   verifyToken,
//   verifyRole(["admin"]),
//   getSalonEmployees
// );


// router.put(
//   "/salon/:salonId/employee/:employeeId/deactivate",
//   verifyToken,
//   verifyRole(["admin"]),
//   deactivateEmployee
// );

// router.patch(
//   "/superadmin/salon/:salonId/employee/:employeeId/activate",
//   verifyToken,
//   verifyRole(["superadmin"]),
//   activateEmployee
// );

// router.patch(
//   "/salon/:salonId/master-employee/:employeeId",
//   verifyToken,
//   setMasterEmployee
// );


router.post(
  "/spa/:spaId/services",
  verifyToken,
  verifyRole(["admin"]),
  uploadSpaServiceImage.single("image"),
  addSpaService
);

router.put(
  "/spa/:spaId/services/:serviceId",
  verifyToken,
  verifyRole(["admin"]),
  uploadSpaServiceImage.single("image"),
  updateSpaService
);

router.get(
  "/spa/:spaId/services",
  verifyToken,
  verifyRole(["admin"]),
  getSpaServices
);

router.delete(
  "/spa/:spaId/services/:serviceId",
  verifyToken,
  verifyRole(["admin"]),
  deleteSpaService
);

router.patch(
  "/spa/:spaId/services/:serviceId/toggle",
  verifyToken,
  verifyRole(["admin"]),
  toggleSpaService
);

router.get(
  "/:salonId/customers",
  getSalonCustomers
);


export default router;
