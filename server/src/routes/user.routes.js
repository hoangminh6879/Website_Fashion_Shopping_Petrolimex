import express from "express";
import {
  requestSeller,
  approveSeller,
  getAddresses,
  addAddress,
  deleteAddress,
  updateAddress
} from "../controllers/user.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// User address management
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);
router.put("/addresses/:addressId", protect, updateAddress);

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