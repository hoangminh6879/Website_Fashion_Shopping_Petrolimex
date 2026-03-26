import mongoose from "mongoose";
// Define the OrderItem schema
const orderItemSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

  color: String,
  size: String,


  quantity: Number,
  price: Number,
});

export default mongoose.model("OrderItem", orderItemSchema);