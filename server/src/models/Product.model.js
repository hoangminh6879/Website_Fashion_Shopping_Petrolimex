import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: String,
    description: String,

    images: [String],

    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);