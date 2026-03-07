import express from "express";
import { addReview, bookAppointment, cancelCustomerAppointment, getBookedSlotsByDate, getCustomerAppointments, getCustomerBusinesses, getCustomerFavorites, getEmployees, getFullPlaceDetails, getReviewsByPlace, getServicesByPincode, getStaffAvailability, rescheduleAppointment, toggleFavorite, getOwnerReviews } from "../controllers/customersControllers.js";
import { verifyToken,verifyRole } from "../middlerware/authMiddleware.js";


const router = express.Router();
/**
 * Example:
 * /api/image/uploads/salon/salon123.jpg
 */
router.get(
  "/services/:pincode",
  getServicesByPincode
);

router.get("/businesses", getCustomerBusinesses);
router.get("/employees", getEmployees);

router.post(
  "/appointments/book",
  verifyToken,
  verifyRole(['customer']),
  bookAppointment
);

router.get(
  "/appointments/:customerId",
  verifyToken,
  verifyRole(['customer']),
  getCustomerAppointments
);



router.post(
  "/availability",
  verifyToken,
  verifyRole(["customer"]),
  getStaffAvailability
);

router.get(
  "/:type/details/:placeId",
  getFullPlaceDetails
);

router.delete(
  "/:type/:placeId/appointments/:appointmentId",
  verifyToken,
  verifyRole(['customer']),
  cancelCustomerAppointment
);

router.post(
  "/appointments/reschedule",
  verifyToken,
  verifyRole(['customer']),
  rescheduleAppointment
);

router.get(
  "/customer/slots/:type/:placeId",
  getBookedSlotsByDate
);

router.post(
  "/reviews/add",
  verifyToken,
  verifyRole(['customer']),
  addReview
);

router.get(
  "/reviews/:type/:placeId",
  getReviewsByPlace
);

router.post(
  "/favorites/toggle",
  verifyToken,
  verifyRole(['customer']),
  toggleFavorite
);

router.get(
  "/favorites/:customerId",
  verifyToken,
  verifyRole(['customer']),
  getCustomerFavorites
);


router.get(
  "/reviews",
  verifyToken,
  verifyRole(["owner"]),
  getOwnerReviews
);

export default router;
