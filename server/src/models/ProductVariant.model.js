import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true, // 🔥 query nhanh
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
    },

    // 🔥 optional
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔥 unique combo
productVariantSchema.index(
  { product: 1, size: 1, color: 1 },
  { unique: true }
);

export default mongoose.model("ProductVariant", productVariantSchema);