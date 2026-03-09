import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { env } from "./config/env.js";

import { activityLoggerMiddleware } from "./middlerware/activityLoggerMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ImageRoutes from "./routes/ImageRoutes.js";
import adminSpaRoutes from "./routes/adminSpaRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import SuperAdminRoutes from "./routes/superadminRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import missedCallRoutes from "./routes/missedCallRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import offersRoutes from "./routes/offersRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import marketingRoutes from "./routes/marketingRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import activityLogsRoutes from "./routes/activityLogsRoutes.js";
import appointmentRoutes from "./routes/appoinmentRoutes.js";
import calendarSettingsRoutes from "./routes/calendarSettings.routes.js";
import businessDetails from "./routes/businessDetails.routes.js";
import contactRoutes from './routes/contactRoutes.js';
//superadmin
import SuperAdmindashboardRoutes from "./routes/superadmin-dashboardRoutes.js";
import salonRoutes from "./routes/salonRoutes.js";
import userManagementRoutes from "./routes/userManagementRoutes.js";
import complianceRoutes from "./routes/complianceRoutes.js";
import systemRoutes from "./routes/system.js";
import founderRoutes from "./routes/founder.js";
import whiteLabelRoutes from "./routes/whiteLabelRoutes.js";
import NotificationRoutes from "./routes/NotificationRoutes.js";
import superadminReportRoutes from "./routes/superadminreportRoutes.js";
import superadminsubscriptionRoutes from "./routes/superadminsubscriptionRoutes.js";

dotenv.config();

const app = express();

/* -------------------- CORS CONFIG -------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:3003",
  "http://127.0.0.1:5173",
  "https://adminglowbiz.vercel.app",
  "https://customerglowbiz.vercel.app",
  "https://nexsalon.vercel.app",
  "https://super-six-flax.vercel.app",
  "https://super-ibobrnsto-sunayanaaryahsworld-alts-projects.vercel.app",
  "https://sunayanaaryahsworld-alts-projects.vercel.app",
  "https://nex-tau-liard.vercel.app",
  "https://salonn-kappa.vercel.app", // ✅ Added - was missing, causing the CORS error
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "X-Requested-With", "Accept"],
  credentials: true,
}));

app.options("*", cors());

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

/* -------------------- ROUTES -------------------- */
app.get("/", (req, res) => {
  res.json({ success: true, message: "Salon API is running 🚀" });
});

app.use('/api/contacts', contactRoutes);
app.use("/api/image/uploads", ImageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/adminspa", adminSpaRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/superadmin", SuperAdminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use(
  "/api/inventory",
  activityLoggerMiddleware({ type: "Inventory" }),
  inventoryRoutes
);

app.use(
  "/api/expenses",
  activityLoggerMiddleware({ type: "Finance" }),
  expenseRoutes
);

app.use(
  "/api/invoices",
  activityLoggerMiddleware({ type: "Finance" }),
  invoiceRoutes
);

app.use(
  "/api/appointments",
  activityLoggerMiddleware({ type: "Appointment" }),
  appointmentRoutes
);
app.use("/webhooks/whatsapp", whatsappRoutes);
app.use("/missed-call", missedCallRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api", reportsRoutes);
app.use("/api", profileRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/activity-logs", activityLogsRoutes);
app.use("/api/admin", calendarSettingsRoutes);
app.use("/api/admin", businessDetails);
//superadmin
app.use("/api/superdashboard", SuperAdmindashboardRoutes);
app.use("/api/salon", salonRoutes);
app.use("/api/superdashboard", userManagementRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/founder", founderRoutes);
app.use("/api/white-label", whiteLabelRoutes);
app.use("/api/superadmin", NotificationRoutes);
app.use("/api/report", superadminReportRoutes);
app.use("/api", superadminsubscriptionRoutes);

/* -------------------- SERVER -------------------- */
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});