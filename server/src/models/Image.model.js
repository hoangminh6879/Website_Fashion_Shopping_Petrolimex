import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    altText: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Image = mongoose.model("Image", imageSchema);
export default Image;
