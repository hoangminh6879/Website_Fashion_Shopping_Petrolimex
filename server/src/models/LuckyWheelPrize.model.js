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
  if (this.type === "coupon" && !this.couponId) {
    return next(new Error("Giải thưởng thẻ giảm giá cần có ID của thẻ (couponId)"));
  }
  if (this.type === "no_luck") {
    this.couponId = null; // Chúc bạn may mắn lần sau không cẩn couponId
  }
  next();
});

export default mongoose.model("LuckyWheelPrize", luckyWheelPrizeSchema);
