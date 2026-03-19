import mongoose from "mongoose";

const productSaleSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // nếu muốn giảm giá theo variant (chuẩn hơn)
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },

    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },

    discountValue: {
      type: Number,
      required: true,
    },

    startDate: Date,
    endDate: Date,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProductSale", productSaleSchema);