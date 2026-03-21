import express from "express";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";
import { 
  getDashboardStats, 
  getAllUsers, 
  getAllShops, 
  updateUserRole,
  updateShopStatus
} from "../controllers/admin.controller.js";
import { approveSeller } from "../controllers/user.controller.js";

const router = express.Router();

// Tất cả route admin đều yêu cầu đăng nhập và role = "admin"
router.use(protect, authorizeRoles("admin"));

// Thống kê chung
router.get("/stats", getDashboardStats);

// Quản lý người dùng
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);

// API duyệt seller (từ chối hoặc duyệt đều có thể thiết kế thêm sau, hiện dùng hàm approveSeller có sẵn)
router.put("/users/:id/approve-seller", approveSeller);

// Quản lý cửa hàng
router.get("/shops", getAllShops);
router.put("/shops/:id/status", updateShopStatus);

export default router;
