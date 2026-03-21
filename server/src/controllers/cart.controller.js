import Cart from "../models/Cart.model.js";
import CartItem from "../models/CartItem.model.js";

// Lấy giỏ hàng của user
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = await Cart.create({ user: userId });
      return res.json([]);
    }

    const cartItems = await CartItem.find({ cart: cart._id }).populate({
      path: "product",
      populate: { path: "shop", select: "name address phone" }
    });
    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Thêm sản phẩm vào giỏ
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, color, size, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId });
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ chưa (cùng màu, cùng size)
    let cartItem = await CartItem.findOne({
      cart: cart._id,
      product: productId,
      color: color || "",
      size: size || ""
    });

    if (cartItem) {
      cartItem.quantity += (quantity || 1);
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cart: cart._id,
        product: productId,
        color: color || "",
        size: size || "",
        quantity: quantity || 1
      });
    }

    // Trả về sau khi populate để frontend lấy được ảnh, tên, giá, shop
    const populatedItem = await CartItem.findById(cartItem._id).populate({
      path: "product",
      populate: { path: "shop", select: "name address phone" }
    });
    res.status(201).json(populatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật số lượng
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, color, size, quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    if (quantity <= 0) {
      await CartItem.findOneAndDelete({ 
        cart: cart._id, 
        product: productId, 
        color: color || "", 
        size: size || "" 
      });
      return res.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng" });
    }

    const cartItem = await CartItem.findOneAndUpdate(
      { 
        cart: cart._id, 
        product: productId, 
        color: color || "", 
        size: size || "" 
      },
      { quantity },
      { new: true }
    ).populate({
      path: "product",
      populate: { path: "shop", select: "name address phone" }
    });

    if (!cartItem) return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });

    res.json(cartItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xóa 1 sản phẩm khỏi giỏ
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, color, size } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Không có giỏ hàng" });

    await CartItem.findOneAndDelete({ 
      cart: cart._id, 
      product: productId, 
      color: color || "", 
      size: size || "" 
    });
    
    res.json({ message: "Đã xóa sản phẩm" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xóa tất cả
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      await CartItem.deleteMany({ cart: cart._id });
    }
    res.json({ message: "Đã làm trống giỏ hàng" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
