import Coupon from "../models/Coupon.model.js";
import Shop from "../models/Shop.model.js";
import jwt from "jsonwebtoken";

// @desc    Middleware kiểm tra token không bắt buộc
export const optionalProtect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    next();
  }
};

// @desc    Lấy danh sách coupon
// @route   GET /api/coupons
// @access  Private (Admin/Seller)
export const getCoupons = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "seller") {
      const shop = await Shop.findOne({ owner: req.user.id });
      if (!shop) {
        return res.status(404).json({ message: "Không tìm thấy shop của bạn" });
      }
      query = { shop: shop._id };
    }

    const coupons = await Coupon.find(query)
      .populate("couponType")
      .populate("shop", "name")
      .sort({ createdAt: -1 });

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Tạo coupon mới
// @route   POST /api/coupons
// @access  Private (Admin/Seller)
export const createCoupon = async (req, res) => {
  try {
    const { code, discount, couponType, expiryDate, quantity } = req.body;

    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: "Mã coupon này đã tồn tại" });
    }

    const newCouponData = {
      code,
      discount,
      couponType,
      expiryDate,
      quantity: Number(quantity) || 0,
      createdBy: req.user.role,
    };

    if (req.user.role === "seller") {
      const shop = await Shop.findOne({ owner: req.user.id });
      if (!shop) {
        return res.status(404).json({ message: "Không tìm thấy shop của bạn" });
      }
      newCouponData.shop = shop._id;
    }

    const coupon = await Coupon.create(newCouponData);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Xóa coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin/Seller)
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Không tìm thấy coupon" });
    }

    // Kiểm tra quyền xóa
    if (req.user.role === "seller") {
      const shop = await Shop.findOne({ owner: req.user.id });
      if (!shop || coupon.shop.toString() !== shop._id.toString()) {
        return res.status(403).json({ message: "Bạn không có quyền xóa coupon này" });
      }
    }

    await coupon.deleteOne();
    res.json({ message: "Đã xóa coupon" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Lấy danh sách coupon khả dụng (cho user checkout)
// @route   GET /api/coupons/available
// @access  Public (đã đăng nhập)
export const getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const { shopIds } = req.query; // Nhận danh sách ID shop từ query (dạng chuỗi cách nhau dấu phẩy)

    let shopIdList = [];
    if (shopIds) {
      shopIdList = shopIds.split(',').filter(id => id.trim() !== "");
    }

    const query = {
      expiryDate: { $gt: now },
      quantity: { $gt: 0 },
      $or: [
        {
          createdBy: 'admin',
          $or: [{ userId: null }, { userId: { $exists: false } }],
          isLuckyWheel: { $ne: true }
        }, // Coupon chung của hệ thống (Admin tạo)
      ]
    };

    // Chỉ truy vấn coupon cá nhân nếu người dùng đã đăng nhập
    if (req.user && req.user.id) {
      query.$or.push({ userId: req.user.id });
    }

    // Nếu có truyền shopIds (trong context mua hàng), chỉ hiện coupon của các shop đó
    if (shopIdList.length > 0) {
      query.$or.push({
        createdBy: 'seller',
        shop: { $in: shopIdList },
        userId: null,
        isLuckyWheel: false
      });
    } else {
      // Nếu không có shopIds (trong Kho Coupon/Ví), hiện tất cả coupon seller có hiệu lực công khai
      query.$or.push({
        createdBy: 'seller',
        $or: [{ userId: null }, { userId: { $exists: false } }],
        isLuckyWheel: { $ne: true }
      });
    }

    const coupons = await Coupon.find(query)
      .populate("couponType")
      .populate("shop", "name")
      .sort({ createdAt: -1 });

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};
