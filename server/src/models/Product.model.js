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

    images: {
      type: [String],
      default: [],
    },

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
  },
  { timestamps: true }
);

// 🔥 tự tạo slug
productSchema.pre("save", function (next) {
  if (this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
  next();
});

export default mongoose.model("Product", productSchema);