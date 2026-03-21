import mongoose from "mongoose";

const couponTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // ví dụ: FREESHIP, PERCENT_DISCOUNT, FIXED_DISCOUNT
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CouponType", couponTypeSchema);