import { Router } from "express";
import { createReservation, getMyReservations } from "../controllers/reservationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/my", requireAuth, getMyReservations);
router.post("/", requireAuth, createReservation);

export default router;
