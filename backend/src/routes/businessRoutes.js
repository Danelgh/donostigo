import { Router } from "express";
import { getBusinessById, getBusinesses } from "../controllers/businessController.js";

const router = Router();

router.get("/", getBusinesses);
router.get("/:id", getBusinessById);

export default router;
