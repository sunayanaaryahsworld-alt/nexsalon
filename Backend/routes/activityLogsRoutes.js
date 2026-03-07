import express from "express";
import {
  getActivityLogs,
  postTestActivityLog,
} from "../controllers/activityLogController.js";

const router = express.Router();

/* READ (real) */
router.get("/", getActivityLogs);

/* POST (TEMP – testing only) */
router.post("/test", postTestActivityLog);

export default router;
