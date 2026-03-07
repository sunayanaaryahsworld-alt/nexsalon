import express from "express";
import { register, login, EmpLogin, newRegister, newLogin, verifyOtp, resendOtp } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/employee/login", EmpLogin);
router.post("/new-register", newRegister);
router.post("/new-login", newLogin);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);



export default router;