import fs from 'fs';

const filePath = 'd:/Website_Fashion_Shopping_Petrolimex/server/src/controllers/review.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
content = content.replace('import Shop from "../models/Shop.model.js";', 
                          'import Shop from "../models/Shop.model.js";\nimport { updateShopMetrics } from "../utils/shopMetrics.js";');

// 2. Enhance createReview
const createReviewOld = `export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;
    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating: Number(rating) || 5,
      comment,
      images: images || [],
    });

    res.status(201).json({
      message: "Đã đăng đánh giá thành công! ⭐",
      review,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};`;

const createReviewNew = `export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, images, orderId } = req.body;
    
    // Check if product exists and get shopId
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Review per item check
    if (orderId) {
      const existing = await Review.findOne({ user: req.user.id, product: productId, order: orderId });
      if (existing) return res.status(400).json({ message: "Sản phẩm này đã được đánh giá cho đơn hàng hiện tại!" });
    }

    const review = await Review.create({
      user: req.user.id,
      product: productId,
      shop: product.shop,
      order: orderId,
      rating: Number(rating) || 5,
      comment,
      images: images || [],
    });

    // Update shop reputation score
    await updateShopMetrics(product.shop);

    res.status(201).json({
      message: "Đã đăng đánh giá thành công! ⭐",
      review,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};`;

content = content.replace(createReviewOld, createReviewNew);

// 3. Enhance createShopReview
const createShopReviewOld = `export const createShopReview = async (req, res) => {
  try {
    const { shopId, rating, comment } = req.body;
    
    // Check if user already reviewed this shop
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

    // Update shop average rating
    const reviews = await ShopReview.find({ shop: shopId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await Shop.findByIdAndUpdate(shopId, { rating: avgRating });

    res.status(201).json({
      message: "Đã đánh giá Shop thành công! ⭐",
      review,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};`;

const createShopReviewNew = `export const createShopReview = async (req, res) => {
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

    const metrics = await updateShopMetrics(shopId);
    if (metrics) {
        await Shop.findByIdAndUpdate(shopId, { rating: metrics.score });
    }

    res.status(201).json({
      message: "Đã đánh giá Shop thành công! ⭐",
      review,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};`;

content = content.replace(createShopReviewOld, createShopReviewNew);

fs.writeFileSync(filePath, content);
console.log('review.controller.js Bayesian-ready.');
