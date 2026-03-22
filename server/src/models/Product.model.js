import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
      },
    ],

    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // 🔥 quan trọng (xóa category không lỗi)
    },

    rating: {
      type: Number,
      default: 0,
    },

    sold: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true, // 🔥 dùng để ẩn sản phẩm
    },

    slug: {
      type: String,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    colors: {
      type: [String],
      default: [],
    },

    sizes: {
      type: [String],
      default: [],
    },

    stock: {
      type: [Number],
      default: [],
    },
    variantImages: {
      type: [String],
      default: [],
    },
    // --- Flash Sale Features ---
    isFlashSale: {
      type: Boolean,
      default: false,
    },
    flashSalePrice: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    flashSaleEndDate: {
      type: Date,
    },
    flashSaleStock: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// 🔥 tự tạo slug
productSchema.pre("save", async function () {
  if (this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
});

export default mongoose.model("Product", productSchema);