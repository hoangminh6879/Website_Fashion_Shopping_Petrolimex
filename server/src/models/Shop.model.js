import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    address: { type: String },
    phone: { type: String },
    fanpage: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Shop", shopSchema);