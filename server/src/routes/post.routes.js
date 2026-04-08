import express from "express";
import {
  createPost,
  getPosts,
  getPendingPosts,
  updatePostStatus,
  toggleLike,
  toggleDislike,
} from "../controllers/post.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Công khai: Xem bài viết đã duyệt
router.get("/", getPosts);

// Cần đăng nhập: Tạo bài viết, Like, Dislike
router.post("/", protect, createPost);
router.put("/:id/like", protect, toggleLike);
router.put("/:id/dislike", protect, toggleDislike);

// Admin: Xem bài viết chờ duyệt, Cập nhật trạng thái
router.get("/pending", protect, authorizeRoles("admin"), getPendingPosts);
router.put("/:id/status", protect, authorizeRoles("admin"), updatePostStatus);

export default router;
