import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
});

export default mongoose.model("Category", categorySchema);