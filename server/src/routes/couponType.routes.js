import express from "express";
import {
  getCouponTypes,
  createCouponType,
  updateCouponType,
  deleteCouponType,
} from "../controllers/couponType.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorizeRoles("admin"), getCouponTypes)
  .post(protect, authorizeRoles("admin"), createCouponType);

router
  .route("/:id")
  .put(protect, authorizeRoles("admin"), updateCouponType)
  .delete(protect, authorizeRoles("admin"), deleteCouponType);

export default router;
