import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import {
  markAttendance,
  getActiveSession,
} from "../controller/userController.js";

const router = express.Router();

router.use(auth);

router.post("/attendance/mark", markAttendance);
router.get("/sessions/active", getActiveSession);

export default router;
