import LuckyWheelPrize from "../models/LuckyWheelPrize.model.js";
import User from "../models/User.model.js";

// @desc    Lấy danh sách các giải thưởng vòng quay may mắn
// @route   GET /api/lucky-wheel
// @access  Public (để user cũng xem được vòng quay)
export const getPrizes = async (req, res) => {
  try {
    const prizes = await LuckyWheelPrize.find().populate("couponId").sort({ createdAt: -1 });
    res.json(prizes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Tạo giải thưởng vòng quay mới
// @route   POST /api/lucky-wheel
// @access  Private (Admin)
export const createPrize = async (req, res) => {
  try {
    const { name, discount, couponType, expiryDays, probability, quantity, color, isActive } = req.body;
    
    const prize = await LuckyWheelPrize.create({
      name,
      type: 'coupon', // Mặc định là coupon
      couponId: null,
      discount: Number(discount) || 0,
      couponType: couponType || null,
      expiryDays: Number(expiryDays) || 30,
      probability: Number(probability) || 0,
      quantity: quantity !== undefined && quantity !== "" ? Number(quantity) : -1,
      color: color || '#f59e0b',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(prize);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo giải thưởng", error: error.message });
  }
};

// @desc    Cập nhật giải thưởng
// @route   PUT /api/lucky-wheel/:id
// @access  Private (Admin)
export const updatePrize = async (req, res) => {
  try {
    const { name, discount, couponType, expiryDays, probability, quantity, color, isActive } = req.body;
    const prize = await LuckyWheelPrize.findById(req.params.id);

    if (!prize) {
      return res.status(404).json({ message: "Không tìm thấy giải thưởng" });
    }

    prize.name = name || prize.name;
    prize.type = 'coupon';
    prize.couponId = null;
    if (discount !== undefined) prize.discount = Number(discount);
    prize.couponType = couponType || prize.couponType;
    if (expiryDays !== undefined) prize.expiryDays = Number(expiryDays);
    if (probability !== undefined) prize.probability = Number(probability);
    if (quantity !== undefined && quantity !== "") prize.quantity = Number(quantity);
    prize.color = color || prize.color;
    if (isActive !== undefined) prize.isActive = isActive;

    await prize.save();
    res.json(prize);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
  }
};

// @desc    Xóa giải thưởng
// @route   DELETE /api/lucky-wheel/:id
// @access  Private (Admin)
export const deletePrize = async (req, res) => {
  try {
    const prize = await LuckyWheelPrize.findById(req.params.id);
    if (!prize) {
      return res.status(404).json({ message: "Không tìm thấy giải thưởng" });
    }

    await prize.deleteOne();
    res.json({ message: "Đã xóa giải thưởng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa", error: error.message });
  }
};

// @desc    Quay số vòng quay may mắn
// @route   POST /api/lucky-wheel/spin
// @access  Private
export const spinWheel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Chỉ USER mới được quay
    if (user.role !== 'user') {
      return res.status(403).json({ message: "Chỉ khách hàng mới có thể tham gia vòng quay này!" });
    }

    // Check 1 spin per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastSpinDate && user.lastSpinDate >= today) {
      return res.status(400).json({ message: "Bạn đã hết lượt quay hôm nay. Vui lòng quay lại vào ngày mai!" });
    }

    const prizes = await LuckyWheelPrize.find({ isActive: true }).populate("couponId").populate("couponType");
    if (prizes.length === 0) return res.status(400).json({ message: "Vòng quay đang trống!" });

    // Lọc ra các giải còn số lượng
    const availablePrizes = prizes.filter(p => p.quantity === -1 || p.quantity > 0);
    if (availablePrizes.length === 0) return res.status(400).json({ message: "Tất cả phần thưởng đã hết!" });

    // Random theo xác suất
    const totalWeight = availablePrizes.reduce((sum, p) => sum + p.probability, 0);
    if (totalWeight === 0) return res.status(400).json({ message: "Tỉ lệ trúng thưởng đang bị lỗi!" });
    
    let randomNum = Math.random() * totalWeight;
    let wonPrize = null;
    
    for (const prize of availablePrizes) {
      if (randomNum < prize.probability) {
        wonPrize = prize;
        break;
      }
      randomNum -= prize.probability;
    }
    
    if (!wonPrize) wonPrize = availablePrizes[availablePrizes.length - 1];

    if (wonPrize.quantity > 0) {
      wonPrize.quantity -= 1;
      await wonPrize.save();
    }

    // Save user's last spin
    user.lastSpinDate = new Date();
    
    let couponCode = null;

    // Add coupon if won
    if (wonPrize.discount > 0 && wonPrize.couponType) {
        const Coupon = (await import("../models/Coupon.model.js")).default;
        
        // Create a unique user coupon from template
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        couponCode = `LW-${timestamp}-${randomSuffix}`;
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (wonPrize.expiryDays || 30));

        const newCoupon = await Coupon.create({
            code: couponCode,
            discount: wonPrize.discount,
            couponType: wonPrize.couponType._id,
            expiryDate,
            quantity: 1,
            createdBy: 'admin',
            userId: user._id, // Private coupon
            isLuckyWheel: true
        });

        if (!user.savedCoupons) user.savedCoupons = [];
        user.savedCoupons.push(newCoupon._id);
    }

    await user.save();

    res.json({
      message: "Quay thành công",
      prize: wonPrize,
      isWinner: wonPrize.discount > 0, // Dùng để frontend phân biệt trúng vs xịt
      couponCode: couponCode 
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi vòng quay", error: error.message });
  }
};

