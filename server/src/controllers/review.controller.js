import Review from "../models/Review.model.js";
import Product from "../models/Product.model.js";
import ShopReview from "../models/ShopReview.model.js";
import Shop from "../models/Shop.model.js";
import { updateShopMetrics } from "../utils/shopMetrics.js";

// 🔥 CREATE REVIEW
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, images, orderId } = req.body;
    
    // Check if product exists and get shopId
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // One review per order-product pair
    if (orderId) {
      const existing = await Review.findOne({ user: req.user.id, product: productId, order: orderId });
      if (existing) return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này cho đơn hàng hiện tại!" });
    } else {
      // Fallback for legacy (optional)
      const existing = await Review.findOne({ user: req.user.id, product: productId });
      if (existing) return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này rồi!" });
    }

    const review = await Review.create({
      user: req.user.id,
      product: productId,
      shop: product.shop, 
      order: orderId,
      rating: Number(rating) || 0,
      comment,
      images: Array.isArray(images) ? images : [],
    });

    // Bayesian aggregation update
    await updateShopMetrics(product.shop);
    
    // Calculate product's own average rating
    const productReviews = await Review.find({ product: productId });
    const productAvgRating = productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length;
    await Product.findByIdAndUpdate(productId, { rating: productAvgRating || 0 });

    res.status(201).json({
      message: "Đã đăng đánh giá thành công! ⭐",
      review,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET REVIEWS BY PRODUCT
export const getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name avatar")
      .sort("-createdAt");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET SELLER REVIEWS
export const getSellerReviews = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const reviews = await Review.find({ shop: shop._id })
      .populate("user", "name avatar")
      .populate("product", "name images")
      .sort("-createdAt");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 REPLY TO REVIEW
export const replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop || review.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Không có quyền trả lời đánh giá này" });
    }

    review.reply = reply;
    review.repliedAt = new Date();
    await review.save();

    res.json({ message: "Đã phản hồi đánh giá thành công!", review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 CREATE SHOP REVIEW
export const createShopReview = async (req, res) => {
  try {
    const { shopId, rating, comment } = req.body;
    
    const existingReview = await ShopReview.findOne({ user: req.user.id, shop: shopId });
    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá Shop này rồi!" });
    }

    const review = await ShopReview.create({
      user: req.user.id,
      shop: shopId,
      rating: Number(rating) || 5,
      comment,
    });

    await updateShopMetrics(shopId);

    res.status(201).json({
      message: "Đã đánh giá Shop thành công! ⭐",
      review,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET SHOP REVIEWS
export const getShopReviews = async (req, res) => {
  try {
    const reviews = await ShopReview.find({ shop: req.params.shopId })
      .populate("user", "name avatar")
      .sort("-createdAt");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET MY SHOP REVIEWS (FOR SELLER)
export const getMyShopReviews = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const reviews = await ShopReview.find({ shop: shop._id })
      .populate("user", "name avatar")
      .sort("-createdAt");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 REPLY TO SHOP REVIEW
export const replyToShopReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await ShopReview.findById(req.params.id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop || review.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Không có quyền trả lời" });
    }

    review.reply = reply;
    review.repliedAt = new Date();
    await review.save();

    res.json({ message: "Đã phản hồi Shop Review!", review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
