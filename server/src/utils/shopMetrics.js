import ShopMetrics from "../models/ShopMetrics.model.js";
import Review from "../models/Review.model.js";
import ShopReview from "../models/ShopReview.model.js";
import Order from "../models/Order.model.js";
import OrderItem from "../models/OrderItem.model.js";

export const updateShopMetrics = async (shopId) => {
  try {
    let metrics = await ShopMetrics.findOne({ shop: shopId });
    if (!metrics) {
      metrics = new ShopMetrics({ shop: shopId });
    }

    // 1. Rating Aggregation (Bayesian approach as proposed)
    // Formula: (v/(v+m)) * R + (m/(v+m)) * C
    const productReviews = await Review.find({ shop: shopId });
    const shopReviews = await ShopReview.find({ shop: shopId });
    const allReviews = [...productReviews, ...shopReviews];
    
    const v = allReviews.length;
    const m = 10; // min reviews for credibility
    const R = v > 0 ? allReviews.reduce((acc, r) => acc + r.rating, 0) / v : 5;
    const C = 4.5; // Average platform rating
    
    metrics.avgRating = R;
    metrics.totalReviews = v;
    
    // Bayesian Score
    const weightedRating = (v / (v + m)) * R + (m / (v + m)) * C;
    
    // 2. Success/Cancel rate
    // We need to find items belonging to this shop across all orders
    const items = await OrderItem.find({}).populate({
        path: 'product',
        match: { shop: shopId }
    });
    
    const filteredItems = items.filter(i => i.product !== null);
    // Be careful with i.order being potentially null
    const orderIds = [...new Set(filteredItems.filter(i => i && i.order).map(i => i.order.toString()))];
    const orders = await Order.find({ _id: { $in: orderIds } });
    
    metrics.totalOrders = orders.length;
    metrics.completedOrders = orders.filter(o => o.status === 'completed').length;
    metrics.cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    
    if (metrics.totalOrders > 0) {
      metrics.successRate = (metrics.completedOrders / metrics.totalOrders) * 100;
      metrics.cancelRate = (metrics.cancelledOrders / metrics.totalOrders) * 100;
    } else {
      metrics.successRate = 100; // default for new shops
      metrics.cancelRate = 0;
    }

    // 3. Final Reputation Score (Weighting components)
    // score = 0.5 * rating_score + 0.3 * success_rate + 0.2 * (1-cancel_rate)
    const ratingScore = weightedRating; // 0-5
    const successPercentScore = (metrics.successRate / 100) * 5;
    const reliabilityPercentScore = (1 - (metrics.cancelRate / 100)) * 5;
    
    metrics.score = (0.5 * ratingScore) + (0.3 * successPercentScore) + (0.2 * reliabilityPercentScore);
    metrics.updatedAt = new Date();
    
    await metrics.save();
    return metrics;
  } catch (err) {
    console.error("Error updating shop metrics:", err);
    throw err; // throw to let controller handle it
  }
};
