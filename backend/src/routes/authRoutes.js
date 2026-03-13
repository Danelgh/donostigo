import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  register,
  updateCurrentUser
} from "../controllers/authController.js";
import { authRateLimit } from "../middleware/authRateLimit.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", requireAuth, updateCurrentUser);
router.post("/logout", requireAuth, logout);

export default router;
