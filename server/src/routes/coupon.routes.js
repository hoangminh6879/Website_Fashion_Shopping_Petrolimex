import express from "express";
import {
  getCoupons,
  createCoupon,
  deleteCoupon,
} from "../controllers/coupon.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorizeRoles("admin", "seller"), getCoupons)
  .post(protect, authorizeRoles("admin", "seller"), createCoupon);

router
  .route("/:id")
  .delete(protect, authorizeRoles("admin", "seller"), deleteCoupon);

export default router;
