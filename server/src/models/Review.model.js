import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Link to verified purchase
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },

    rating: { type: Number, default: 5, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: { type: [String], default: [] },
    reply: { type: String, default: "" },
    repliedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);