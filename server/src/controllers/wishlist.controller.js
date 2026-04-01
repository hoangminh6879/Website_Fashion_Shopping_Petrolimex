import Wishlist from "../models/Wishlist.model.js";

// 🔥 GET USER WISHLIST
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: "products",
      populate: { path: "images" }
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    res.json(wishlist.products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 TOGGLE PRODUCT IN WISHLIST (ADD/REMOVE)
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [productId] });
      return res.json({ message: "Đã thêm vào yêu thích! ❤️", products: wishlist.products });
    }

    const index = wishlist.products.indexOf(productId);
    if (index === -1) {
      wishlist.products.push(productId);
      await wishlist.save();
      return res.json({ message: "Đã thêm vào yêu thích! ❤️", added: true });
    } else {
      wishlist.products.splice(index, 1);
      await wishlist.save();
      return res.json({ message: "Đã xóa khỏi yêu thích! 💔", added: false });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
