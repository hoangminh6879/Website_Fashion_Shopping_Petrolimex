import Cart from "../models/Cart.model.js";
import CartItem from "../models/CartItem.model.js";
import Product from "../models/Product.model.js";
import ProductVariant from "../models/ProductVariant.model.js";

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const userId = req.user._id;

    // 1. Tìm hoặc tạo giỏ hàng cho người dùng
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId });
    }

    // 2. Kiểm tra biến thể có tồn tại không và còn hàng không
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: "Biến thể sản phẩm không tồn tại" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ success: false, message: "Không đủ hàng trong kho" });
    }

    // 3. Kiểm tra xem sản phẩm này với biến thể này đã có trong giỏ chưa
    let cartItem = await CartItem.findOne({
      cart: cart._id,
      product: productId,
      variant: variantId,
    });

    if (cartItem) {
      // Nếu đã có, cập nhật số lượng
      cartItem.quantity += parseInt(quantity);
      
      // Kiểm tra lại tồn kho sau khi cộng dồn
      if (variant.stock < cartItem.quantity) {
        return res.status(400).json({ success: false, message: "Tổng số lượng vượt quá tồn kho" });
      }
      
      await cartItem.save();
    } else {
      // Nếu chưa có, tạo mới
      cartItem = await CartItem.create({
        cart: cart._id,
        product: productId,
        variant: variantId,
        quantity: parseInt(quantity),
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã thêm vào giỏ hàng",
      cartItem,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { items: [], totalPrice: 0 },
      });
    }

    const items = await CartItem.find({ cart: cart._id })
      .populate({
        path: "product",
        select: "name price images",
        populate: { path: "images", select: "url" }
      })
      .populate("variant", "size color price stock image");

    // Tính tổng tiền an toàn hơn
    let totalPrice = 0;
    const formattedItems = items.map(item => {
      const itemObj = item.toObject();
      // Ưu tiên giá của variant nếu có, nếu không lấy giá product
      const price = itemObj.variant ? itemObj.variant.price : (itemObj.product ? itemObj.product.price : 0);
      const subTotal = price * itemObj.quantity;
      totalPrice += subTotal;

      return {
        ...itemObj,
        price,
        subTotal
      };
    });

    res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        items: formattedItems,
        totalPrice,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItemQuantity = async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: "Số lượng phải lớn hơn 0" });
    }

    const cartItem = await CartItem.findById(cartItemId).populate("variant");
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Không tìm thấy mục trong giỏ hàng" });
    }

    // Kiểm tra tồn kho
    if (cartItem.variant && cartItem.variant.stock < quantity) {
      return res.status(400).json({ success: false, message: "Số lượng vượt quá tồn kho" });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({
      success: true,
      message: "Đã cập nhật số lượng",
      cartItem,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:id
// @access  Private
export const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    const cartItem = await CartItem.findByIdAndDelete(id);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Không tìm thấy mục để xóa" });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      await CartItem.deleteMany({ cart: cart._id });
    }

    res.status(200).json({
      success: true,
      message: "Giỏ hàng đã được làm trống",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
