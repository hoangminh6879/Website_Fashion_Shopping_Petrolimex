import express from "express";
import {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus
} from "../controllers/order.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.use(protect); // Tất cả các route trong này đều phải đăng nhập

router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);

// Admin or Seller update status
router.put("/:id/status", authorizeRoles("admin", "seller"), updateOrderStatus);

export default router;
