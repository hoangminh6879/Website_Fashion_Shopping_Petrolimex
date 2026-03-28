import express from "express";
import {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus
} from "../controllers/order.controller.js";
import {
    createVNPayPaymentUrl,
    vnpayReturn,
    vnpayIPN
} from "../controllers/vnpay.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";


const router = express.Router();

// ─── Public VNPay callback routes (called by VNPay server, no auth needed) ───
router.get("/vnpay/vnpay_return", vnpayReturn);
router.get("/vnpay/vnpay_ipn", vnpayIPN);

// ─── Protected routes (require login) ────────────────────────────────────────
router.use(protect);

// VNPay: tạo URL thanh toán + đơn hàng
router.post("/vnpay/create_payment_url", createVNPayPaymentUrl);

// COD order
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);

// Admin or Seller update status
router.put("/:id/status", authorizeRoles("admin", "seller"), updateOrderStatus);

export default router;
