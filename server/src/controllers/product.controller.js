import Shop from "../models/Shop.model.js";
import Product from "../models/Product.model.js";
import ProductVariant from "../models/ProductVariant.model.js";

// 🔥 CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { name, description, category, images, variants } = req.body;

    if (!variants || variants.length === 0) {
      return res.status(400).json({
        message: "Sản phẩm phải có ít nhất 1 variant",
      });
    }

    const shop = await Shop.findOne({ owner: req.user.id });

    if (!shop) {
      return res.status(400).json({
        message: "Bạn chưa có shop",
      });
    }

    const product = await Product.create({
      name,
      description,
      category,
      images,
      shop: shop._id,
    });

    const variantDocs = variants.map((v) => ({
      ...v,
      product: product._id,
      sku: `${product._id}-${v.size}-${v.color}`,
    }));

    await ProductVariant.insertMany(variantDocs);

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
      .populate("category");

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
      .populate("category");

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

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
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

    await Product.findByIdAndDelete(req.params.id);

    await ProductVariant.deleteMany({
      product: req.params.id,
    });

    res.json({ message: "Đã xóa sản phẩm" });
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