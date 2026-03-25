import express from "express";
import {
  getProductsInEvent,
  getMyProductEvents,
  getPendingProductEvents,
  registerProductToEvent,
  approveProductEvent,
  withdrawProductEvent,
  adminRemoveProductFromEvent,
  recalculateEventPrices,
} from "../controllers/productEvent.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getProductsInEvent);                                               // Public
router.get("/my", protect, authorizeRoles("seller"), getMyProductEvents);          // Seller
router.get("/pending", protect, authorizeRoles("admin"), getPendingProductEvents); // Admin

router.post("/", protect, authorizeRoles("seller"), registerProductToEvent);       // Seller registers
router.post("/admin/recalculate/:eventId", protect, authorizeRoles("admin"), recalculateEventPrices); // Admin syncs
router.put("/:id/approve", protect, authorizeRoles("admin"), approveProductEvent); // Admin approves
router.delete("/admin/:id", protect, authorizeRoles("admin"), adminRemoveProductFromEvent); // Admin removes
router.delete("/:id", protect, authorizeRoles("seller"), withdrawProductEvent);    // Seller withdraws

export default router;
