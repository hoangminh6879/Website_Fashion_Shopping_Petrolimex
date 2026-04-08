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

    // 1. Order status breakdown
    const statusStats = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 2. Revenue by Month (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 3. Revenue by Shop
    const shopRevenue = await Order.aggregate([
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "order",
          as: "items"
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.shop",
          revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, { $multiply: ["$items.price", "$items.quantity"] }, 0] } },
          soldCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$items.quantity", 0] } },
          cancelledCount: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, "$items.quantity", 0] } }
        }
      },
      {
        $lookup: {
          from: "shops",
          localField: "_id",
          foreignField: "_id",
          as: "shopInfo"
        }
      },
      { $unwind: "$shopInfo" },
      { $project: { name: "$shopInfo.name", revenue: 1, soldCount: 1, cancelledCount: 1 } },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Revenue totals
    const totalRevenue = (await Order.find({ status: "completed" })).reduce((sum, order) => sum + (order.totalPrice || 0), 0);

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
        totalRevenue,
      },
      statusStats,
      monthlyRevenue,
      shopRevenue,
      latestOrders
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
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

export const lockUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { lockDays, reason } = req.body;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (lockDays === 0 || !lockDays) {
       user.adminLockUntil = undefined;
       user.adminLockReason = "";
       await Notification.create({
          recipient: user._id,
          title: "Tài khoản được mở khóa",
          message: `Tài khoản của bạn đã được mở khóa bởi quản trị viên.`,
          type: "system"
       });
    } else {
       const lockDate = new Date();
       lockDate.setDate(lockDate.getDate() + parseInt(lockDays));
       user.adminLockUntil = lockDate;
       user.adminLockReason = reason || "Vi phạm chính sách của sàn";
       
       // Force remove tokens or at least log lock logic
    }
    await user.save();
    res.json({ message: lockDays ? "Đã khóa người dùng" : "Đã mở khóa người dùng", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const lockShopAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { lockDays, reason } = req.body;
    
    const shop = await Shop.findById(id).populate("owner");
    if (!shop) return res.status(404).json({ message: "Không tìm thấy Shop" });

    if (lockDays === 0 || !lockDays) {
       shop.adminLockUntil = undefined;
       shop.adminLockReason = "";
       await Notification.create({
          recipient: shop.owner._id || shop.owner,
          title: "Kênh bán hàng được mở khóa",
          message: `Shop "${shop.name}" của bạn đã được mở khóa bởi quản trị viên.`,
          type: "shop"
       });
    } else {
       const lockDate = new Date();
       lockDate.setDate(lockDate.getDate() + parseInt(lockDays));
       shop.adminLockUntil = lockDate;
       shop.adminLockReason = reason || "Vi phạm quy định bán hàng";
       
       await Notification.create({
          recipient: shop.owner._id || shop.owner,
          title: "CẢNH BÁO: Kênh bán hàng bị khóa tạm thời",
          message: `Shop "${shop.name}" của bạn đã bị quản trị viên khóa trong ${lockDays} ngày. Lý do: ${shop.adminLockReason}`,
          type: "shop"
       });
    }
    await shop.save();
    res.json({ message: lockDays ? "Đã khóa Shop" : "Đã mở khóa Shop", shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
