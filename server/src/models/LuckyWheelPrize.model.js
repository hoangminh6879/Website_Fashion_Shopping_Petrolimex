import mongoose from "mongoose";

const luckyWheelPrizeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["coupon", "no_luck"],
      required: true,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    discount: {
      type: Number,
      min: 0,
    },
    couponType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CouponType",
    },
    expiryDays: {
      type: Number,
      default: 30,
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    quantity: {
      type: Number, // Số lượng giải (vd: 100 giải). -1 nếu vô hạn.
      required: true,
      default: -1,
    },
    color: {
      type: String, // Màu nền của ô vòng quay trên frontend
      required: true,
      default: "#FFFFFF",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Middleware kiểm tra trước khi lưu
luckyWheelPrizeSchema.pre("save", function (next) {
  // Đã đơn giản hóa: Admin chỉ cần điền tên và các thông số cần thiết.
  // Nếu discount > 0 mới cần couponType.
  if (this.type === "coupon" && this.discount > 0 && !this.couponType) {
    return next(new Error("Giải thưởng cần có thông tin loại coupon (couponType)"));
  }
  next();
});

export default mongoose.model("LuckyWheelPrize", luckyWheelPrizeSchema);
