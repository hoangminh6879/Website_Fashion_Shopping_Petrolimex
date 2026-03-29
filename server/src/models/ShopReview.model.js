import mongoose from "mongoose";

const shopReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    comment: { type: String, default: "" },
    reply: { type: String, default: "" },
    repliedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("ShopReview", shopReviewSchema);
