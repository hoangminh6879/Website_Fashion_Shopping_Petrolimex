import mongoose from "mongoose";

/**
 * EventType - Loại sự kiện khuyến mãi (ví dụ: Flash Sale, Mùa hè, Ngày lễ...)
 */
const eventTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Ví dụ: "FLASH_SALE", "SEASONAL", "CLEARANCE", "HOLIDAY"
    },

    label: {
      type: String,
      required: true,
      trim: true,
      // Tên hiển thị thân thiện: "Flash Sale", "Khuyến mãi theo mùa"...
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    icon: {
      type: String,
      default: "🎉",
      // Emoji hoặc URL icon đại diện
    },

    color: {
      type: String,
      default: "#f59e0b",
      // Màu chủ đạo hiển thị trên UI
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("EventType", eventTypeSchema);
