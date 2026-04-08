import Comment from "../models/Comment.model.js";
import Post from "../models/Post.model.js";
import { createNotification } from "./notification.controller.js";

// @desc    Thêm bình luận vào bài viết
// @route   POST /api/comments
export const addComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;
    if (!content || !postId) {
      return res.status(400).json({ message: "Thiếu thông tin bình luận" });
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user.id,
      content,
      parentComment: parentCommentId || null,
    });

    // Cập nhật số lượng bình luận trong Post
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populatedComment = await Comment.findById(comment._id).populate("user", "name avatar");

    // Thông báo
    let actorName = req.user.name;
    if (!actorName) {
        const actor = await User.findById(req.user.id).select('name');
        actorName = actor?.name || 'Người dùng';
    }
    if (parentCommentId) {
      // Nếu là reply, thông báo cho người sở hữu comment cha
      const parent = await Comment.findById(parentCommentId);
      if (parent && parent.user.toString() !== req.user.id) {
        await createNotification({
          recipient: parent.user,
          sender: req.user.id,
          title: "Phản hồi mới",
          message: `${actorName} đã phản hồi bình luận của bạn: "${content.substring(0, 30)}..."`,
          type: "social",
          link: `/social-feed`
        });
      }
    } else {
      // Nếu là bình luận gốc, thông báo cho chủ bài viết
      const post = await Post.findById(postId);
      if (post && post.user.toString() !== req.user.id) {
        await createNotification({
          recipient: post.user,
          sender: req.user.id,
          title: "Bình luận mới",
          message: `${actorName} đã bình luận bài viết của bạn.`,
          type: "social",
          link: `/social-feed`
        });
      }
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Lấy danh sách bình luận của một bài viết (Bao gồm cả reply)
// @route   GET /api/comments/:postId
export const getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "name avatar")
      .sort({ createdAt: 1 }); // Sắp xếp cũ trước mới sau để dễ theo dõi hội thoại

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Thích bình luận
// @route   PUT /api/comments/:id/like
export const toggleCommentLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận" });

    const userId = req.user.id;
    const isLiked = comment.likes.includes(userId);

    await comment.save();
    const populated = await Comment.findById(comment._id).populate("user", "name avatar");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Không thích bình luận
// @route   PUT /api/comments/:id/dislike
export const toggleCommentDislike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận" });

    const userId = req.user.id;
    const isDisliked = comment.dislikes.includes(userId);

    if (isDisliked) {
      comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userId);
    } else {
      comment.dislikes.push(userId);
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    }

    await comment.save();
    const populated = await Comment.findById(comment._id).populate("user", "name avatar");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Xóa bình luận
// @route   DELETE /api/comments/:id
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận" });

    if (comment.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền xóa bình luận này" });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ message: "Đã xóa bình luận" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};
