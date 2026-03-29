import mongoose from "mongoose";

const shopMetricsSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, unique: true },
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    successRate: { type: Number, default: 100 }, // %
    cancelRate: { type: Number, default: 0 }, // %
    responseRate: { type: Number, default: 100 }, // %
    lateShippingRate: { type: Number, default: 0 }, // %
    score: { type: Number, default: 5.0 }, // [0-5] or [0-1]
    
    // Aggregation data
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    lateOrders: { type: Number, default: 0 },
    repliedMessages: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },

    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("ShopMetrics", shopMetricsSchema);
