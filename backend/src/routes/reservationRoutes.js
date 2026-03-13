import { Router } from "express";
import {
  createReservation,
  getBusinessReservations,
  getMyReservations
} from "../controllers/reservationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/my", requireAuth, getMyReservations);
router.get("/business", requireAuth, getBusinessReservations);
router.post("/", requireAuth, createReservation);

export default router;
