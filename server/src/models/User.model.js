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
      required: function () {
        return !this.googleId; // mật khẩu chỉ bắt buộc nếu không có googleId
      },
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true, // cho phép nhiều user có googleId null nhưng duy nhất nếu có
    },

    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },

    phone: String,
    address: String, // Keep for backward compatibility or as default string
    addresses: [
      {
        receiverName: String,
        phone: String,
        street: String,
        ward: String,
        district: String,
        city: String,
        isDefault: { type: Boolean, default: false }
      }
    ],
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

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);