import { Router } from "express";
import {
  createReservation,
  getBusinessAvailability,
  getBusinessReservations,
  getBusinessWaitlistEntries,
  getMyWaitlistEntries,
  getMyReservations,
  joinReservationWaitlist,
  updateWaitlistStatus,
  updateReservationStatus
} from "../controllers/reservationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/businesses/:businessId/availability", getBusinessAvailability);
router.get("/my", requireAuth, getMyReservations);
router.get("/waitlist/my", requireAuth, getMyWaitlistEntries);
router.get("/waitlist/business", requireAuth, getBusinessWaitlistEntries);
router.patch("/waitlist/:id/status", requireAuth, updateWaitlistStatus);
router.get("/business", requireAuth, getBusinessReservations);
router.patch("/:id/status", requireAuth, updateReservationStatus);
router.post("/", requireAuth, createReservation);
router.post("/waitlist", requireAuth, joinReservationWaitlist);

export default router;
