import express from "express";
import {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Tất cả các route giỏ hàng đều yêu cầu đăng nhập và role 'user'
router.use(protect);
router.use(authorizeRoles("user"));

router.post("/add", addToCart);
router.get("/", getCart);
router.put("/update", updateCartItemQuantity);
router.delete("/remove/:id", removeCartItem);
router.delete("/clear", clearCart);

export default router;
