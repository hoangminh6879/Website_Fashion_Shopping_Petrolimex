import express from "express";
import {
  requestSeller,
  approveSeller,
} from "../controllers/user.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// user gửi yêu cầu
router.post("/request-seller", protect, requestSeller);

// admin duyệt
router.put(
  "/approve-seller/:id",
  protect,
  authorizeRoles("admin"),
  approveSeller
);

export default router;