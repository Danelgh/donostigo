import { Router } from "express";
import {
  getBusinessById,
  getBusinesses,
  getCategories,
  getMyBusiness,
  getRecommendedBusinesses,
  upsertMyBusiness
} from "../controllers/businessController.js";
import { createBusinessReview, upsertBusinessReviewResponse } from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/categories", getCategories);
router.get("/me", requireAuth, getMyBusiness);
router.get("/recommended", requireAuth, getRecommendedBusinesses);
router.patch("/me", requireAuth, upsertMyBusiness);
router.get("/", getBusinesses);
router.get("/:id", getBusinessById);
router.post("/:id/reviews", requireAuth, createBusinessReview);
router.post("/:id/reviews/:reviewId/response", requireAuth, upsertBusinessReviewResponse);

export default router;
