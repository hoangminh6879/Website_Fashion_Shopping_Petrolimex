import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },

  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
  },

  quantity: Number,
});

export default mongoose.model("CartItem", cartItemSchema);