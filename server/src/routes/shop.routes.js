import express from "express";
import { createShop } from "../controllers/shop.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// chỉ seller mới tạo được
router.post("/", protect, authorizeRoles("seller"), createShop);

export default router;