import express from "express";
import { getWishlist, toggleWishlist } from "../controllers/wishlist.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getWishlist);
router.post("/toggle", protect, toggleWishlist);

export default router;
