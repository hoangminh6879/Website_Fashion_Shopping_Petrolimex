import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
    },

    // 👉 loại ưu đãi (freeship, giảm %,...)
    couponType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CouponType",
      required: true,
    },

    // 👉 phân biệt ai tạo
    createdBy: {
      type: String,
      enum: ["admin", "seller"],
      required: true,
    },

    // 👉 nếu là seller thì có shop
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    usedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ Validate logic
couponSchema.pre("save", function (next) {
  if (this.createdBy === "seller" && !this.shop) {
    return next(new Error("Coupon của seller phải có shopId"));
  }

  if (this.createdBy === "admin" && this.shop) {
    return next(new Error("Coupon của admin không được có shopId"));
  }

  next();
});

export default mongoose.model("Coupon", couponSchema);