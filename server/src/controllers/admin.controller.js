import User from "../models/User.model.js";
import Shop from "../models/Shop.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";
import Notification from "../models/Notification.model.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ status: "active" });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    // Revenue stats
    const orders = await Order.find({ status: "completed" });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // Latest Activities
    const latestOrders = await Order.find()
      .populate("user", "name email")
      .limit(5)
      .sort({ createdAt: -1 });

    res.json({
      summary: {
        totalUsers,
        totalShops,
        activeShops,
        totalProducts,
        totalOrders,
        totalRevenue
      },
      latestOrders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find().populate("owner", "name email").sort({ createdAt: -1 });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!["user", "seller", "admin"].includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    user.role = role;
    if (role === 'seller' && user.sellerRequest) {
      user.sellerRequest.status = "approved";
    }
    await user.save();

    // Thông báo cho user khi được thay đổi vai trò
    const roleLabels = { user: "Người dùng", seller: "Người bán", admin: "Quản trị viên" };
    await Notification.create({
      recipient: user._id,
      title: "Vai trò của bạn đã được cập nhật",
      message: `Tài khoản của bạn đã được cập nhật vai trò thành: ${roleLabels[role] || role}.`,
      type: "system"
    });

    res.json({ message: "Đã cập nhật vai trò", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateShopStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!["pending", "active", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const shop = await Shop.findByIdAndUpdate(id, { status }, { new: true }).populate("owner", "name email");
    if (!shop) return res.status(404).json({ message: "Không tìm thấy cửa hàng" });

    // Thông báo cho chủ shop
    const statusMessages = {
      active: `Shop "${shop.name}" của bạn đã được duyệt thành công! 🎉 Bạn có thể bắt đầu bán hàng ngay.`,
      rejected: `Shop "${shop.name}" của bạn đã bị từ chối. Vui lòng kiểm tra lại thông tin và thử đăng ký lại.`,
      pending: `Shop "${shop.name}" của bạn đang chờ được duyệt.`
    };
    await Notification.create({
      recipient: shop.owner._id || shop.owner,
      title: status === "active" ? "Shop đã được duyệt! 🎉" : status === "rejected" ? "Shop bị từ chối" : "Shop đang chờ duyệt",
      message: statusMessages[status],
      type: "shop"
    });

    res.json({ message: "Đã cập nhật trạng thái cửa hàng", shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
