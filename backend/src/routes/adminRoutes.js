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
  getAllUsersForMatching, // import new function
  markAttendanceByAdmin, // import new function
} from "../controller/adminController.js";

const router = express.Router();
router.use(auth, isAdmin);
router.get("/sessions/download/:sessionId", downloadReport);



// Add the two new routes
router.get("/users/match-data", getAllUsersForMatching);
router.post("/attendance/mark", markAttendanceByAdmin);

router.post("/locations", addLocation);
router.get("/locations", getLocations);
router.delete("/locations/:id", deleteLocation);

router.post("/sessions/start", startSession);
router.put("/sessions/end", endSession);
router.get("/sessions/active/attendance", getPresentUsers);
router.get("/sessions/previous", getPreviousSessions);

export default router;
