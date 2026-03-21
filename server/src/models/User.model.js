import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },

    phone: String,
    address: String,
    avatar: String,

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },

    sellerRequest: {
      status: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
      reason: { type: String, default: "" },
      proofImage: { type: String, default: "" }
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);