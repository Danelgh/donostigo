import { Router } from "express";
import {
  createReservation,
  getBusinessReservations,
  getMyReservations,
  updateReservationStatus
} from "../controllers/reservationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/my", requireAuth, getMyReservations);
router.get("/business", requireAuth, getBusinessReservations);
router.patch("/:id/status", requireAuth, updateReservationStatus);
router.post("/", requireAuth, createReservation);

export default router;
