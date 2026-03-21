import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },

  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
  },

  color: { type: String, default: "" },
  size: { type: String, default: "" },

  quantity: {
    type: Number,
    min: 0,
    default: 1
  },
});

export default mongoose.model("CartItem", cartItemSchema);