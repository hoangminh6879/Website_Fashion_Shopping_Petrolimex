import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from "../controllers/cart.controller.js";

const router = express.Router();

// Chỉ user đăng nhập mới dùng được giỏ hàng trên DB, cấm Admin / Seller
router.use(protect, authorizeRoles("user"));

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.delete("/remove", removeFromCart);
router.delete("/clear", clearCart);

export default router;
