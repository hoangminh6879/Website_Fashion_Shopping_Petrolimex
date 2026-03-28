import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    totalPrice: {
      type: Number,
      required: true,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    shippingFee: {
      type: Number,
      default: 0,
    },

    vouchers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    }],

    status: {
      type: String,
      enum: ["pending", "pending_payment", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },

    // Trạng thái thanh toán (dùng cho VNPay)
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    address: String,
    phone: String,
    paymentMethod: {
      type: String,
      enum: ["COD", "VNPAY"],
      default: "COD",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
