import ShopMetrics from "../models/ShopMetrics.model.js";
import Review from "../models/Review.model.js";
import Order from "../models/Order.model.js";
import OrderItem from "../models/OrderItem.model.js";
import Shop from "../models/Shop.model.js";

export const updateShopMetrics = async (shopId) => {
  try {
    let metrics = await ShopMetrics.findOne({ shop: shopId });
    if (!metrics) {
      metrics = new ShopMetrics({ shop: shopId });
    }

    // 1. Rating Aggregation (Real data: Average of all product reviews)
    const productReviews = await Review.find({ shop: shopId });
    
    const v = productReviews.length;
    // Simple average calculation
    const R = v > 0 ? productReviews.reduce((acc, r) => acc + r.rating, 0) / v : 5;
    
    metrics.avgRating = R;
    metrics.totalReviews = v;
    
    // We also update the Shop model diretamente to reflect this "real" rating
    await Shop.findByIdAndUpdate(shopId, { rating: Number(R.toFixed(1)) });

    // 2. Success/Cancel rate
    const items = await OrderItem.find({}).populate({
        path: 'product',
        match: { shop: shopId }
    });
    
    const filteredItems = items.filter(i => i.product !== null);
    const orderIds = [...new Set(filteredItems.filter(i => i && i.order).map(i => i.order.toString()))];
    const orders = await Order.find({ _id: { $in: orderIds } });
    
    metrics.totalOrders = orders.length;
    metrics.completedOrders = orders.filter(o => o.status === 'completed').length;
    metrics.cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    
    if (metrics.totalOrders > 0) {
      metrics.successRate = (metrics.completedOrders / metrics.totalOrders) * 100;
      metrics.cancelRate = (metrics.cancelledOrders / metrics.totalOrders) * 100;
    } else {
      metrics.successRate = 100;
      metrics.cancelRate = 0;
    }

    // 3. Score (Still used for some rankings but primarily follows rating)
    metrics.score = R; 
    metrics.updatedAt = new Date();
    
    await metrics.save();
    return metrics;
  } catch (err) {
    console.error("Error updating shop metrics:", err);
    throw err;
  }
};
