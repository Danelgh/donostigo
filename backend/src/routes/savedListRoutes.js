import { Router } from "express";
import {
  addBusinessToSavedList,
  clonePublicSavedList,
  createSavedList,
  deleteSavedList,
  getPublicSavedListBySlug,
  getPublicSavedLists,
  getMySavedLists,
  removeBusinessFromSavedList,
  updateSavedList
} from "../controllers/savedListController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/public", getPublicSavedLists);
router.get("/public/:slug", getPublicSavedListBySlug);
router.post("/public/:slug/clone", requireAuth, clonePublicSavedList);
router.get("/", requireAuth, getMySavedLists);
router.post("/", requireAuth, createSavedList);
router.patch("/:id", requireAuth, updateSavedList);
router.delete("/:id", requireAuth, deleteSavedList);
router.post("/:id/businesses", requireAuth, addBusinessToSavedList);
router.delete("/:id/businesses/:businessId", requireAuth, removeBusinessFromSavedList);

export default router;
