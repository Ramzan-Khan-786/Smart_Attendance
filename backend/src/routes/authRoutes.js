import express from "express";
import {
  registerUser,
  loginUser,
  registerAdmin,
  loginAdmin,
  getMe,
} from "../controller/authController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register/user", registerUser);
router.post("/login/user", loginUser);
router.post("/register/admin", registerAdmin);
router.post("/login/admin", loginAdmin);
router.get("/me", auth, getMe);

export default router;
