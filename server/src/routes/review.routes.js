import express from "express";
import { 
  createReview, 
  getReviewsByProduct, 
  getSellerReviews, 
  replyToReview,
  createShopReview,
  getShopReviews,
  getMyShopReviews,
  replyToShopReview
} from "../controllers/review.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Shop Reviews (must be BEFORE /:productId wildcard)
router.post("/shop", protect, createShopReview);
router.get("/shop/myshop", protect, authorizeRoles("seller"), getMyShopReviews);
router.get("/shop/:shopId", getShopReviews);
router.post("/shop/:id/reply", protect, authorizeRoles("seller"), replyToShopReview);

// Product Reviews
router.post("/", protect, createReview);
router.get("/seller", protect, authorizeRoles("seller"), getSellerReviews);
router.post("/:id/reply", protect, authorizeRoles("seller"), replyToReview);
router.get("/:productId", getReviewsByProduct);

export default router;
