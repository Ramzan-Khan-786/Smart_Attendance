import express from "express";
import { auth, isAdmin } from "../middleware/authMiddleware.js";
import {
  addLocation,
  getLocations,
  startSession,
  endSession,
  getPresentUsers,
  getPreviousSessions,
  downloadReport,
} from "../controller/adminController.js";

const router = express.Router();

router.use(auth, isAdmin);
router.get("/sessions/download/:filename", downloadReport);
router.post("/locations", addLocation);
router.get("/locations", getLocations);
router.post("/sessions/start", startSession);
router.put("/sessions/end", endSession);
router.get("/sessions/active/attendance", getPresentUsers);
router.get("/sessions/previous", getPreviousSessions);


export default router;
