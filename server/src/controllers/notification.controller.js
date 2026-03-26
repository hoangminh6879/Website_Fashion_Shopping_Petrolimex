import Notification from "../models/Notification.model.js";

// Tạo thông báo mới (thường dùng ở các controller khác)
export const createNotification = async (data) => {
  try {
    return await Notification.create(data);
  } catch (err) {
    console.error("Lỗi khi tạo thông báo:", err.message);
  }
};

// Lấy danh sách thông báo của người dùng hiện tại
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đánh dấu đã đọc
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.recipient.toString() !== req.user.id) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }
    notification.isRead = true;
    await notification.save();
    res.json({ message: "Đã đánh dấu là đã đọc" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đánh dấu tất cả đã đọc
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: "Đã đánh dấu tất cả là đã đọc" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xóa thông báo
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.recipient.toString() !== req.user.id) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa thông báo" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
