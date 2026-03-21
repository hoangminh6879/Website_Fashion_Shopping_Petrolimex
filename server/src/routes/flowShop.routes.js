import express from "express";
import { toggleFollowShop, getFollowedShops, checkFollowStatus } from "../controllers/flowShop.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/toggle", protect, toggleFollowShop);
router.get("/my-followed", protect, getFollowedShops);
router.get("/status/:shopId", protect, checkFollowStatus);

export default router;
