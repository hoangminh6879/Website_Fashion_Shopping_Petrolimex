import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // hỗ trợ category cha - con
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);