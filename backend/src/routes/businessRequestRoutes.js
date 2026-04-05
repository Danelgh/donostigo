import { Router } from "express";
import {
  createBusinessRequest,
  getBusinessServiceRequests,
  getMyBusinessRequests,
  respondToBusinessRequestProposal,
  updateBusinessRequestVoucherStatus,
  updateBusinessRequestStatus
} from "../controllers/businessRequestController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/my", requireAuth, getMyBusinessRequests);
router.get("/business", requireAuth, getBusinessServiceRequests);
router.post("/", requireAuth, createBusinessRequest);
router.patch("/:id/status", requireAuth, updateBusinessRequestStatus);
router.patch("/:id/customer-response", requireAuth, respondToBusinessRequestProposal);
router.patch("/:id/voucher-status", requireAuth, updateBusinessRequestVoucherStatus);

export default router;
