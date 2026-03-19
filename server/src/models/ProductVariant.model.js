import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
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
      sparse: true, // 🔥 FIX LỖI duplicate null
    },
  },
  { timestamps: true }
);


// 🔥 đảm bảo 1 product không bị trùng size + color
productVariantSchema.index(
  { product: 1, size: 1, color: 1 },
  { unique: true }
);

export default mongoose.model("ProductVariant", productVariantSchema);