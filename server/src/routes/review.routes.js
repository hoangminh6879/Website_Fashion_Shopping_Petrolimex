import express from "express";
import { createReview, getReviewsByProduct } from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createReview);
router.get("/:productId", getReviewsByProduct);

export default router;
