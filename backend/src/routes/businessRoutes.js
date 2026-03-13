import { Router } from "express";
import { getBusinessById, getBusinesses } from "../controllers/businessController.js";
import { createBusinessReview } from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getBusinesses);
router.get("/:id", getBusinessById);
router.post("/:id/reviews", requireAuth, createBusinessReview);

export default router;
