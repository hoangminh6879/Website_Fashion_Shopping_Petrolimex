import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    description: String,
    logo: String,

    isApproved: { type: Boolean, default: false },

    followersCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Shop", shopSchema);