import Shop from "../models/Shop.model.js";
import Product from "../models/Product.model.js";
import ProductVariant from "../models/ProductVariant.model.js";

export const createProduct = async (req, res) => {
  try {
    const { name, description, category, images, price, colors, sizes, stock } = req.body;

    const shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(400).json({
        message: "Bạn chưa có shop",
      });
    }

    if (shop.status !== "active") {
      return res.status(403).json({
        message: "Chỉ shop đã được duyệt mới có thể đăng sản phẩm",
      });
    }

    const product = await Product.create({
      name,
      description,
      category,
      images,
      price: price || 0,
      colors: colors || [],
      sizes: sizes || [],
      stock: Array.isArray(stock) ? stock : [Number(stock) || 0],
      shop: shop._id,
    });

    res.status(201).json({
      message: "Tạo sản phẩm thành công",
      product,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET ALL PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("shop")
      .populate("category")
      .populate("images");

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET PRODUCT DETAIL (QUAN TRỌNG)
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("shop")
      .populate("category")
      .populate("images");

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const variants = await ProductVariant.find({
      product: req.params.id,
    });

    // 🔥 TRẢ VỀ CHUẨN FRONTEND
    res.json({
      ...product.toObject(),
      variants,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const shop = await Shop.findOne({ owner: req.user.id });

    if (!shop || product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({
        message: "Không có quyền",
      });
    }

    if (shop.status !== "active") {
      return res.status(403).json({
        message: "Shop của bạn chưa được duyệt hoạt động",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, stock: Array.isArray(req.body.stock) ? req.body.stock : [Number(req.body.stock) || 0] },
      { new: true }
    );

    res.json({
      message: "Cập nhật thành công",
      product: updatedProduct,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const shop = await Shop.findOne({ owner: req.user.id });

    if (!shop || product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({
        message: "Không có quyền",
      });
    }

    if (shop.status !== "active") {
      return res.status(403).json({
        message: "Shop của bạn chưa được duyệt hoạt động",
      });
    }

    // Tìm và xóa tất cả ảnh liên quan
    const Image = (await import("../models/Image.model.js")).default;
    const images = await Image.find({ product: req.params.id });
    
    for (const img of images) {
      const filePath = (await import("path")).join(process.cwd(), "public", img.url);
      const fs = (await import("fs")).default;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await Image.findByIdAndDelete(img._id);
    }

    await Product.findByIdAndDelete(req.params.id);

    await ProductVariant.deleteMany({
      product: req.params.id,
    });

    res.json({ message: "Đã xóa sản phẩm và các ảnh liên quan" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 ADD VARIANT (FIX QUYỀN)
export const addVariant = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    const shop = await Shop.findOne({ owner: req.user.id });

    if (!shop || product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({
        message: "Không có quyền",
      });
    }

    if (shop.status !== "active") {
      return res.status(403).json({
        message: "Shop của bạn chưa được duyệt hoạt động",
      });
    }

    const variant = await ProductVariant.create({
      ...req.body,
      product: req.params.id,
      sku: `${req.params.id}-${req.body.size}-${req.body.color}`,
    });

    res.status(201).json(variant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 UPDATE VARIANT
export const updateVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(variant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 DELETE VARIANT
export const deleteVariant = async (req, res) => {
  try {
    await ProductVariant.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa variant" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 LẤY SẢN PHẨM RIÊNG CỦA SELLER
export const getSellerProducts = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) {
      return res.status(404).json({ message: "Bạn chưa có shop" });
    }
    const products = await Product.find({ shop: shop._id })
      .populate("category")
      .populate("images")
      .sort("-createdAt");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};