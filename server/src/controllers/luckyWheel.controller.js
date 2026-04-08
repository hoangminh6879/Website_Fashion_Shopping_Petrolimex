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
    const { name, type, couponId, probability, quantity, color, isActive } = req.body;
    
    if (type === 'coupon' && !couponId) {
        return res.status(400).json({ message: "Vui lòng chọn coupon cho giải thưởng này!" });
    }

    const prize = await LuckyWheelPrize.create({
      name,
      type,
      couponId: type === 'coupon' ? couponId : null,
      probability: Number(probability) || 0,
      quantity: quantity !== undefined && quantity !== "" ? Number(quantity) : -1,
      color,
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
    const { name, type, couponId, probability, quantity, color, isActive } = req.body;
    const prize = await LuckyWheelPrize.findById(req.params.id);

    if (!prize) {
      return res.status(404).json({ message: "Không tìm thấy giải thưởng" });
    }

    prize.name = name || prize.name;
    prize.type = type || prize.type;
    prize.couponId = type === 'coupon' ? (couponId || prize.couponId) : null;
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
    
    // Check 1 spin per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastSpinDate && user.lastSpinDate >= today) {
      return res.status(400).json({ message: "Bạn đã hết lượt quay hôm nay. Vui lòng quay lại vào ngày mai!" });
    }

    const prizes = await LuckyWheelPrize.find({ isActive: true }).populate("couponId");
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
    
    // Add coupon to wallet if won
    if (wonPrize.type === 'coupon' && wonPrize.couponId) {
       // Only add if not already in array (optional depending on system rule, let's allow duplicates if possible or check)
       // Usually we can push it normally. Let's just push it.
       if (!user.savedCoupons) user.savedCoupons = [];
       user.savedCoupons.push(wonPrize.couponId._id);
    }

    await user.save();

    res.json({
      message: "Quay thành công",
      prize: wonPrize
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi vòng quay", error: error.message });
  }
};

