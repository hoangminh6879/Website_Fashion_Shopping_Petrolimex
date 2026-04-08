import express from "express";
import {
  addComment,
  getCommentsByPost,
  deleteComment,
  toggleCommentLike,
  toggleCommentDislike,
} from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Công khai: Xem bình luận
router.get("/:postId", getCommentsByPost);

// Cần đăng nhập: Thêm bình luận, Xóa bình luận, Like/Dislike
router.post("/", protect, addComment);
router.put("/:id/like", protect, toggleCommentLike);
router.put("/:id/dislike", protect, toggleCommentDislike);
router.delete("/:id", protect, deleteComment);

export default router;
