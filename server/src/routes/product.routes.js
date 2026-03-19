import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
} from "../controllers/product.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// ================= PRODUCT =================
router.post("/", protect, authorizeRoles("seller"), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", protect, authorizeRoles("seller"), updateProduct);
router.delete("/:id", protect, authorizeRoles("seller"), deleteProduct);

// ================= VARIANT =================
// 🔥 đổi :id → :productId cho rõ ràng
router.post("/:productId/variants", protect, authorizeRoles("seller"), addVariant);

router.put("/variants/:id", protect, authorizeRoles("seller"), updateVariant);
router.delete("/variants/:id", protect, authorizeRoles("seller"), deleteVariant);

export default router;