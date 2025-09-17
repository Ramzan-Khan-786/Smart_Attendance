import express from "express";
import { auth, isAdmin } from "../middleware/authMiddleware.js";
import {
  addLocation,
  getLocations,
  deleteLocation,
  startSession,
  endSession,
  getPresentUsers,
  getPreviousSessions,
  downloadReport,
} from "../controller/adminController.js";

const router = express.Router();

// All admin routes are protected by auth and isAdmin middleware
router.use(auth, isAdmin);

// Correct the route parameter to :sessionId
router.get("/sessions/download/:sessionId", downloadReport);

router.post("/locations", addLocation);
router.get("/locations", getLocations);
router.delete("/locations/:id", deleteLocation);

router.post("/sessions/start", startSession);
router.put("/sessions/end", endSession);
router.get("/sessions/active/attendance", getPresentUsers);
router.get("/sessions/previous", getPreviousSessions);

export default router;
