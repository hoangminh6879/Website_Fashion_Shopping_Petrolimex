import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

    rating: { type: Number, default: 5 },
    comment: String,
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);