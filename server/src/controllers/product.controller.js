import Shop from "../models/Shop.model.js";
import Product from "../models/Product.model.js";
import ProductVariant from "../models/ProductVariant.model.js";
import Follow from "../models/FlowShop.model.js";
import Notification from "../models/Notification.model.js";

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

    // Thông báo cho những người theo dõi shop
    const followers = await Follow.find({ shop: shop._id }).select("user");
    if (followers.length > 0) {
      const notifications = followers.map(f => ({
        recipient: f.user,
        title: "Sản phẩm mới từ Shop bạn đang theo dõi!",
        message: `Shop "${shop.name}" vừa đăng một sản phẩm mới: ${name}. Hãy xem ngay!`,
        type: "shop",
        link: `/product/${product._id}`
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: "Tạo sản phẩm thành công",
      product,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET ALL PRODUCTS WITH SEARCH & FILTER
export const getProducts = async (req, res) => {
  try {
    const { shopId, category, search, minPrice, maxPrice, sort } = req.query;
    
    const filter = {};
    
    // Filter by Shop
    if (shopId) filter.shop = shopId;
    
    // Filter by Category
    if (category) filter.category = category;
    
    // Search by Name (Regex)
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    
    // Filter by Price Range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sort Logic
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sort === "price_asc") sortOptions = { price: 1 };
    if (sort === "price_desc") sortOptions = { price: -1 };
    if (sort === "name_asc") sortOptions = { name: 1 };
    if (sort === "name_desc") sortOptions = { name: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };

    const products = await Product.find(filter)
      .populate({
        path: "shop",
        populate: { path: "owner", select: "name avatar" }
      })
      .populate("category")
      .populate("images")
      .sort(sortOptions);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 UPDATE FLASH SALE
export const updateFlashSale = async (req, res) => {
  try {
    const { isFlashSale, discountPercentage, flashSaleEndDate, flashSaleStock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const shop = await Shop.findOne({ owner: req.user.id });

    if (!shop || product.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    // Kiểm tra số lượng flash sale so với tồn kho thực tế
    const totalStock = Array.isArray(product.stock) 
      ? product.stock.reduce((a, b) => a + Number(b), 0) 
      : (Number(product.stock) || 0);

    if (isFlashSale && Number(flashSaleStock) > totalStock) {
      return res.status(400).json({ 
        message: `Số lượng Flash Sale (${flashSaleStock}) không được vượt quá tổng tồn kho (${totalStock})` 
      });
    }

    // Tự tính giá flash sale dựa trên % giảm giá
    const flashSalePrice = isFlashSale 
      ? Math.round(product.price * (1 - (discountPercentage || 0) / 100))
      : 0;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        isFlashSale, 
        discountPercentage: discountPercentage || 0, 
        flashSalePrice,
        flashSaleEndDate: isFlashSale ? flashSaleEndDate : null,
        flashSaleStock: isFlashSale ? Number(flashSaleStock) : 0
      },
      { new: true }
    );

    res.json({
      message: isFlashSale ? "Đã bật Flash Sale ✅" : "Đã tắt Flash Sale ❌",
      product: updatedProduct,
    });

    // Thông báo cho followers khi bật Flash Sale (ngoài response để không delay)
    if (isFlashSale) {
      const followers = await Follow.find({ shop: shop._id }).select("user");
      if (followers.length > 0) {
        const notifications = followers.map(f => ({
          recipient: f.user,
          title: "Flash Sale mới! ⚡",
          message: `Sản phẩm "${product.name}" từ shop "${shop.name}" đang giảm ${discountPercentage}%! Nhanh tay mua ngay!`,
          type: "promotion",
          link: `/product/${product._id}`
        }));
        Notification.insertMany(notifications).catch(err => console.error("Notification error:", err));
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET PRODUCT DETAIL (QUAN TRỌNG)
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: "shop",
        populate: { path: "owner", select: "name avatar" }
      })
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

// 🔥 GET TOP RATED PRODUCTS
export const getTopRatedProducts = async (req, res) => {
  try {
    const { shopId, limit = 4 } = req.query;
    const filter = { isActive: true };
    if (shopId) filter.shop = shopId;

    const products = await Product.find(filter)
      .populate({
        path: "shop",
        populate: { path: "owner", select: "name avatar" }
      })
      .populate("images")
      .sort({ rating: -1, sold: -1 })
      .limit(Number(limit));

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};