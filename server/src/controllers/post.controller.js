import Post from "../models/Post.model.js";
import { createNotification } from "./notification.controller.js";

// @desc    Tạo bài viết mới (Mặc định ở trạng thái chờ duyệt)
// @route   POST /api/posts
export const createPost = async (req, res) => {
  try {
    const { content, images } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Nội dung bài viết không được để trống" });
    }

    const post = await Post.create({
      user: req.user.id,
      content,
      images: images || [],
      status: req.user.role === "admin" ? "approved" : "pending",
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Lấy danh sách bài viết đã phê duyệt
// @route   GET /api/posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "approved" })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Lấy danh sách bài viết chờ phê duyệt (Admin only)
// @route   GET /api/posts/pending
export const getPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "pending" })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Cập nhật trạng thái bài viết (Duyệt/Từ chối)
// @route   PUT /api/posts/:id/status
export const updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body; // approved, rejected
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Thích/Bỏ thích bài viết
// @route   PUT /api/posts/:id/like
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    const userId = req.user.id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
      // Xóa khỏi dislikes nếu có
      post.dislikes = post.dislikes.filter((id) => id.toString() !== userId);

      // Thông báo cho chủ bài viết
      if (post.user.toString() !== userId) {
        let senderName = req.user.name;
        if (!senderName) {
            const User = (await import('../models/User.model.js')).default;
            const sender = await User.findById(userId).select('name');
            senderName = sender?.name || 'Người dùng';
        }
        await createNotification({
          recipient: post.user,
          sender: userId,
          title: "Lượt thích mới",
          message: `${senderName} đã thích bài viết của bạn.`,
          type: "social",
          link: `/social-feed`
        });
      }
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Không thích/Bỏ không thích bài viết
// @route   PUT /api/posts/:id/dislike
export const toggleDislike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    const userId = req.user.id;
    const isDisliked = post.dislikes.includes(userId);

    if (isDisliked) {
      post.dislikes = post.dislikes.filter((id) => id.toString() !== userId);
    } else {
      post.dislikes.push(userId);
      // Xóa khỏi likes nếu có
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};
