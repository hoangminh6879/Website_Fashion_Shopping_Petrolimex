import express from "express";
import { createShop, getMyShop, updateShop, getShopById, getShopMetrics } from "../controllers/shop.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Lấy thông tin shop của tôi
router.get("/my-shop", protect, getMyShop);
router.get("/my-metrics", protect, getShopMetrics);

// Lấy thông tin shop bất kỳ (công khai)
router.get("/:id", getShopById);

// chỉ seller mới tạo được
router.post("/", protect, authorizeRoles("seller"), createShop);

// Cập nhật thông tin shop
router.put("/my-shop", protect, updateShop);

export default router;