import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  addVariant,
  updateVariant,
  deleteVariant,
  updateFlashSale,
} from "../controllers/product.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// ================= PRODUCT =================
router.post("/", protect, authorizeRoles("seller"), createProduct);
router.get("/seller-products", protect, authorizeRoles("seller"), getSellerProducts);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", protect, authorizeRoles("seller"), updateProduct);
router.delete("/:id", protect, authorizeRoles("seller"), deleteProduct);

// Flash Sale Route
router.put("/:id/flash-sale", protect, authorizeRoles("seller"), updateFlashSale);

// ================= VARIANT =================
// 🔥 đổi :id → :productId cho rõ ràng
router.post("/:productId/variants", protect, authorizeRoles("seller"), addVariant);

router.put("/variants/:id", protect, authorizeRoles("seller"), updateVariant);
router.delete("/variants/:id", protect, authorizeRoles("seller"), deleteVariant);

export default router;