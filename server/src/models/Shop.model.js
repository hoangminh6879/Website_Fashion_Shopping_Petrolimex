import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    address: { type: String },
    phone: { type: String },
    fanpage: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ["pending", "active", "rejected"], default: "pending" },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Shop", shopSchema);