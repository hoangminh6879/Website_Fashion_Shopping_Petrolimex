import mongoose from "mongoose";

/**
 * ProductEvent - Sản phẩm tham gia sự kiện
 * Kế thừa từ sản phẩm của các shop trong hệ thống,
 * cho phép ghi đè giá, tồn kho riêng cho từng sự kiện.
 */
const productEventSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      // Sản phẩm gốc từ một shop bất kỳ trong hệ thống
    },

    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      // Shop sở hữu sản phẩm (denormalized để query nhanh)
    },

    // --- Ghi đè giá riêng cho sự kiện ---
    eventPrice: {
      type: Number,
      required: true,
      // Giá bán trong sự kiện (sau giảm)
    },

    originalPrice: {
      type: Number,
      required: true,
      // Giá gốc (copy từ product.price lúc đăng ký)
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      // % giảm riêng cho sản phẩm này (có thể khác % của sự kiện)
    },

    // --- Tồn kho riêng cho sự kiện ---
    eventStock: {
      type: Number,
      required: true,
      default: 0,
      // Số lượng sản phẩm dành cho sự kiện (giới hạn riêng)
    },

    soldInEvent: {
      type: Number,
      default: 0,
      // Số đã bán trong sự kiện
    },

    maxPerUser: {
      type: Number,
      default: 0,
      // Giới hạn số lượng mỗi người dùng có thể mua (0 = không giới hạn)
    },

    // --- Trạng thái duyệt ---
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "removed"],
      default: "pending",
      // Admin duyệt sản phẩm vào sự kiện
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    // --- Hiển thị ---
    displayOrder: {
      type: Number,
      default: 0,
      // Thứ tự hiển thị trong danh sách sự kiện
    },

    isFeatured: {
      type: Boolean,
      default: false,
      // Sản phẩm nổi bật trong sự kiện
    },
  },
  { timestamps: true }
);

// Unique: mỗi sản phẩm chỉ tham gia một sự kiện một lần
productEventSchema.index({ event: 1, product: 1 }, { unique: true });

// Virtual: số lượng còn lại
productEventSchema.virtual("remainingStock").get(function () {
  return Math.max(0, this.eventStock - this.soldInEvent);
});

productEventSchema.set("toJSON", { virtuals: true });
productEventSchema.set("toObject", { virtuals: true });

export default mongoose.model("ProductEvent", productEventSchema);
