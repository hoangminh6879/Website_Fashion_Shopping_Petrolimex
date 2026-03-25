import ProductEvent from "../models/ProductEvent.model.js";
import Event from "../models/Event.model.js";
import Product from "../models/Product.model.js";
import Shop from "../models/Shop.model.js";

// GET /api/product-events?eventId=xxx - Public: list approved products in an event
export const getProductsInEvent = async (req, res) => {
  try {
    const { eventId, shopId, status } = req.query;
    const filter = {};
    if (eventId) filter.event = eventId;
    if (shopId) filter.shop = shopId;
    
    // For admin modal, might pass 'all' or empty status to see pending
    if (status && status !== 'all') {
        filter.status = status;
    } else if (!status) {
        filter.status = "approved"; // Public default
    }

    const items = await ProductEvent.find(filter)
      .populate({ path: "product", select: "name images price colors sizes category", populate: { path: "images" } })
      .populate("shop", "name image")
      .populate("event", "name startDate endDate status")
      .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// GET /api/product-events/my - Seller: list own product registrations
export const getMyProductEvents = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ message: "Bạn chưa có shop" });

    const { eventId } = req.query;
    const filter = { shop: shop._id };
    if (eventId) filter.event = eventId;

    const items = await ProductEvent.find(filter)
      .populate({ path: "product", select: "name images price", populate: { path: "images" } })
      .populate("event", "name startDate endDate status discountPercentage")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// GET /api/product-events/pending - Admin: list all pending registrations
export const getPendingProductEvents = async (req, res) => {
  try {
    const items = await ProductEvent.find({ status: "pending" })
      .populate({ path: "product", select: "name images price", populate: { path: "images" } })
      .populate("shop", "name")
      .populate("event", "name startDate endDate")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// POST /api/product-events - Seller: register one or more products to an event (bulk)
// Accepts: { eventId, productIds: [...] }  — price/stock taken from product's own data
export const registerProductToEvent = async (req, res) => {
  try {
    const { eventId, productIds, productId, eventPrice, eventStock, maxPerUser } = req.body;
    const ids = productIds?.length ? productIds : productId ? [productId] : [];

    if (!eventId || ids.length === 0) {
      return res.status(400).json({ message: "Thiếu eventId hoặc danh sách sản phẩm" });
    }

    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(403).json({ message: "Bạn chưa có shop" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });
    if (event.status === "ended") {
      return res.status(400).json({ message: "Sự kiện đã kết thúc, không thể đăng ký" });
    }

    const results = { success: [], skipped: [], errors: [] };

    for (const pid of ids) {
      try {
        const product = await Product.findById(pid);
        if (!product) { results.errors.push({ id: pid, reason: "Không tìm thấy sản phẩm" }); continue; }
        if (product.shop.toString() !== shop._id.toString()) {
          results.errors.push({ id: pid, reason: "Sản phẩm không thuộc shop của bạn" }); continue;
        }

        const existing = await ProductEvent.findOne({ event: eventId, product: pid });
        if (existing) { results.skipped.push({ id: pid, name: product.name, reason: "Đã đăng ký trước đó" }); continue; }

        const totalStock = Array.isArray(product.stock)
          ? product.stock.reduce((s, v) => s + (Number(v) || 0), 0)
          : (Number(product.stock) || 0);

        // Calculate auto-pricing based on event discount
        let finalPrice = product.price;
        if (event.discountPercentage > 0) {
            finalPrice = Math.round(product.price * (1 - event.discountPercentage / 100));
        }

        // For single registration, override if specific values provided
        if (ids.length === 1) {
            if (eventPrice) finalPrice = Number(eventPrice);
        }

        const finalStock = (ids.length === 1 && eventStock) ? Number(eventStock) : (totalStock || 1);
        const finalMaxPerUser = (ids.length === 1 && maxPerUser) ? Number(maxPerUser) : 0;

        await ProductEvent.create({
          event: eventId,
          product: pid,
          shop: shop._id,
          eventPrice: finalPrice,
          originalPrice: product.price,
          eventStock: finalStock,
          maxPerUser: finalMaxPerUser,
          discountPercentage: event.discountPercentage || 0,
        });
        results.success.push({ id: pid, name: product.name });
      } catch (innerErr) {
        results.errors.push({ id: pid, reason: innerErr.message });
      }
    }

    res.status(201).json({ message: `Đã xử lý ${ids.length} sản phẩm`, ...results });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// PUT /api/product-events/:id/approve - Admin: approve or reject
export const approveProductEvent = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const entry = await ProductEvent.findByIdAndUpdate(
      req.params.id,
      {
        status,
        rejectionReason: status === "rejected" ? (rejectionReason || "") : "",
        approvedBy: req.user.id,
        approvedAt: status === "approved" ? new Date() : null,
      },
      { new: true }
    ).populate({ path: "product", select: "name images price", populate: { path: "images" } }).populate("shop", "name").populate("event", "name startDate endDate");

    if (!entry) return res.status(404).json({ message: "Không tìm thấy đăng ký" });

    if (status === "approved") {
      const count = await ProductEvent.countDocuments({ event: entry.event._id, status: "approved" });
      await Event.findByIdAndUpdate(entry.event._id, { totalProductCount: count });
    }

    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// DELETE /api/product-events/:id - Seller: withdraw registration (only if pending)
export const withdrawProductEvent = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(403).json({ message: "Bạn chưa có shop" });

    const entry = await ProductEvent.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Không tìm thấy đăng ký" });
    if (entry.shop.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: "Không có quyền xóa đăng ký này" });
    }
    if (entry.status === "approved") {
      return res.status(400).json({ message: "Không thể rút đăng ký đã được duyệt" });
    }

    await entry.deleteOne();
    res.json({ message: "Đã rút đăng ký sản phẩm khỏi sự kiện" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// DELETE /api/product-events/admin/:id - Admin: remove registration (any status)
export const adminRemoveProductFromEvent = async (req, res) => {
  try {
    const entry = await ProductEvent.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Không tìm thấy đăng ký" });

    const eventId = entry.event;
    await entry.deleteOne();

    // Recalculate or decrement event's totalProductCount
    const Event = (await import("../models/Event.model.js")).default;
    await Event.findByIdAndUpdate(eventId, { $inc: { totalProductCount: -1 } });

    res.json({ message: "Admin đã xóa sản phẩm khỏi sự kiện thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// POST /api/product-events/admin/recalculate/:eventId - Admin: update all prices based on current event discount
export const recalculateEventPrices = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await (await import("../models/Event.model.js")).default.findById(eventId);
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    const discount = Number(event.discountPercentage) || 0;
    const items = await ProductEvent.find({ event: eventId }).populate("product");

    let updatedCount = 0;
    for (const item of items) {
        if (!item.product) continue;
        const op = item.product.price;
        const ep = discount > 0 ? Math.round(op * (1 - discount / 100)) : op;
        
        item.originalPrice = op;
        item.eventPrice = ep;
        item.discountPercentage = discount; // Sync individual discount too
        await item.save();
        updatedCount++;
    }

    res.json({ message: `Đã cập nhật giá cho ${updatedCount} sản phẩm theo mức giảm ${discount}%`, count: updatedCount });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
