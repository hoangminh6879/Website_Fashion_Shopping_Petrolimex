import User from "../models/User.model.js";
import Shop from "../models/Shop.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalShops = await Shop.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    res.json({
      totalUsers,
      totalShops,
      totalProducts,
      totalOrders
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

    res.json({ message: "Đã cập nhật trạng thái cửa hàng", shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
