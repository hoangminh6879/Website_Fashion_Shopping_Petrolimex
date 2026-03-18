import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: String,

  discount: Number,

  type: {
    type: String,
    enum: ["system", "shop"],
  },

  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },

  expiryDate: Date,
});

export default mongoose.model("Coupon", couponSchema);