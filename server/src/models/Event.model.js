import mongoose from "mongoose";

/**
 * Event - Sự kiện khuyến mãi chính của trang web
 */
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // Tên sự kiện: "Flash Sale 12/12", "Tết Sale 2026"
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
    },

    eventType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventType",
      required: true,
    },

    bannerImage: {
      type: String,
      default: "",
      // URL ảnh banner chính của sự kiện
    },

    thumbnailImage: {
      type: String,
      default: "",
      // Ảnh thumbnail hiển thị trong danh sách
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      // % giảm giá chung áp dụng cho toàn bộ sự kiện (nếu có)
    },

    maxDiscountValue: {
      type: Number,
      default: 0,
      // Giảm tối đa (VND) - 0 = không giới hạn
    },

    minOrderValue: {
      type: Number,
      default: 0,
      // Giá trị đơn tối thiểu để áp dụng sự kiện
    },

    status: {
      type: String,
      enum: ["draft", "active", "paused", "ended"],
      default: "draft",
    },

    isPublic: {
      type: Boolean,
      default: true,
      // Hiển thị trên trang chủ hay không
    },

    isFeatured: {
      type: Boolean,
      default: false,
      // Sự kiện nổi bật (hiển thị banner lớn)
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Admin tạo sự kiện
    },

    tags: {
      type: [String],
      default: [],
      // Nhãn phân loại: ["summer", "best-seller", "exclusive"]
    },

    totalProductCount: {
      type: Number,
      default: 0,
      // Tổng số sản phẩm tham gia (denormalized)
    },
  },
  { timestamps: true }
);

// Tự sinh slug từ name
eventSchema.pre("save", function (next) {
  if (this.isModified("name") && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
  next();
});

// Virtual: kiểm tra sự kiện có đang diễn ra không
eventSchema.virtual("isOngoing").get(function () {
  const now = new Date();
  return this.status === "active" && this.startDate <= now && this.endDate >= now;
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

export default mongoose.model("Event", eventSchema);
