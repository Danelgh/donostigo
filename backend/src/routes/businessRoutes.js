import { Router } from "express";
import {
  getBusinessById,
  getBusinesses,
  getCategories,
  getMyBusiness,
  upsertMyBusiness
} from "../controllers/businessController.js";
import { createBusinessReview } from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/categories", getCategories);
router.get("/me", requireAuth, getMyBusiness);
router.patch("/me", requireAuth, upsertMyBusiness);
router.get("/", getBusinesses);
router.get("/:id", getBusinessById);
router.post("/:id/reviews", requireAuth, createBusinessReview);

export default router;
