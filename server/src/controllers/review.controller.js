import Review from "../models/Review.model.js";
import Product from "../models/Product.model.js";

// 🔥 CREATE REVIEW
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;
    
    // Check if user already reviewed
    const existingReview = await Review.findOne({ user: req.user.id, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này rồi!" });
    }

    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating: Number(rating) || 5,
      comment,
      images: Array.isArray(images) ? images : [],
    });

    // Update product overall rating
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(productId, { rating: avgRating });

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
