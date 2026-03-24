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
      populate: [
        { path: "shop", select: "name address phone" },
        { path: "images" }
      ]
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
      populate: [
        { path: "shop", select: "name address phone" },
        { path: "images" }
      ]
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
      populate: [
        { path: "shop", select: "name address phone" },
        { path: "images" }
      ]
    });

    if (!cartItem) return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });

    res.json(cartItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật biến thể (Màu sắc / Kích cỡ)
export const updateVariant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, oldColor, oldSize, newColor, newSize } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    // Tìm item cũ cần đổi
    const oldItem = await CartItem.findOne({
      cart: cart._id,
      product: productId,
      color: oldColor || "",
      size: oldSize || ""
    }).populate("product");

    if (!oldItem) return res.status(404).json({ message: "Không tìm thấy sản phẩm cũ trong giỏ" });

    // KIỂM TRA TỒN KHO CỦA BIẾN THỂ MỚI
    const product = oldItem.product;
    if (!product) return res.status(404).json({ message: "Sản phẩm không còn tồn tại" });

    const colorIdx = (product.colors || []).indexOf(newColor);
    const sizeIdx = (product.sizes || []).indexOf(newSize);

    if (colorIdx === -1 || sizeIdx === -1) {
      return res.status(400).json({ message: "Biến thể không hợp lệ" });
    }

    const stockIndex = colorIdx * (product.sizes?.length || 0) + sizeIdx;
    const availableStock = product.stock[stockIndex] || 0;

    if (availableStock < oldItem.quantity) {
      return res.status(400).json({
        message: `Biến thể mới không đủ hàng (Hiện còn: ${availableStock})`,
        available: availableStock
      });
    }

    // Tìm xem variant mới đã có trong giỏ chưa
    const existingNewVariant = await CartItem.findOne({
      cart: cart._id,
      product: productId,
      color: newColor || "",
      size: newSize || ""
    });

    if (existingNewVariant && existingNewVariant._id.toString() !== oldItem._id.toString()) {
      // Nếu variant mới đã có: cộng dồn vào variant mới và xóa variant cũ
      existingNewVariant.quantity += oldItem.quantity;
      await existingNewVariant.save();
      await CartItem.findByIdAndDelete(oldItem._id);

      const populated = await CartItem.findById(existingNewVariant._id).populate({
        path: "product",
        populate: [
          { path: "shop", select: "name address phone" },
          { path: "images" }
        ]
      });
      return res.json({ message: "Đã gộp biến thể", item: populated, merged: true });
    } else {
      // Nếu chưa có: đổi trực tiếp
      oldItem.color = newColor || "";
      oldItem.size = newSize || "";
      await oldItem.save();

      const populated = await CartItem.findById(oldItem._id).populate({
        path: "product",
        populate: [
          { path: "shop", select: "name address phone" },
          { path: "images" }
        ]
      });
      return res.json({ message: "Đã cập nhật biến thể", item: populated, merged: false });
    }
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
