import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
});

export default mongoose.model("Follow", followSchema);