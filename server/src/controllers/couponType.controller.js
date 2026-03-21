import CouponType from "../models/couponType.model.js";

// @desc    Lấy tất cả loại coupon
// @route   GET /api/coupon-types
// @access  Private/Admin
export const getCouponTypes = async (req, res) => {
  try {
    const couponTypes = await CouponType.find().sort({ createdAt: -1 });
    res.json(couponTypes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Tạo loại coupon mới
// @route   POST /api/coupon-types
// @access  Private/Admin
export const createCouponType = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingType = await CouponType.findOne({ name });
    if (existingType) {
      return res.status(400).json({ message: "Loại coupon này đã tồn tại" });
    }

    const couponType = await CouponType.create({ name, description });
    res.status(201).json(couponType);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Cập nhật loại coupon
// @route   PUT /api/coupon-types/:id
// @access  Private/Admin
export const updateCouponType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const couponType = await CouponType.findById(req.params.id);

    if (!couponType) {
      return res.status(404).json({ message: "Không tìm thấy loại coupon" });
    }

    couponType.name = name || couponType.name;
    couponType.description = description || couponType.description;

    const updatedCouponType = await couponType.save();
    res.json(updatedCouponType);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Xóa loại coupon
// @route   DELETE /api/coupon-types/:id
// @access  Private/Admin
export const deleteCouponType = async (req, res) => {
  try {
    const couponType = await CouponType.findById(req.params.id);

    if (!couponType) {
      return res.status(404).json({ message: "Không tìm thấy loại coupon" });
    }

    await couponType.deleteOne();
    res.json({ message: "Đã xóa loại coupon" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};
