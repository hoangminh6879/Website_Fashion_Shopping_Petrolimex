import Event from "../models/Event.model.js";
import ProductEvent from "../models/ProductEvent.model.js";

// GET /api/events - Public: list active/public events
export const getEvents = async (req, res) => {
  try {
    const { status, featured, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (featured === "true") filter.isFeatured = true;
    if (type) filter.eventType = type;

    const events = await Event.find(filter)
      .populate("eventType", "name label icon color")
      .populate("createdBy", "name email")
      .sort({ startDate: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// GET /api/events/ongoing - Public: events currently active
export const getOngoingEvents = async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      status: { $in: ["active", "draft"] },
      endDate: { $gte: now },
    })
      .populate("eventType", "name label icon color")
      .sort({ isFeatured: -1, startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// GET /api/events/upcoming - Public: events not yet started (for sellers to register)
export const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      status: { $in: ["draft", "active"] },
      startDate: { $gt: now },
    })
      .populate("eventType", "name label icon color")
      .sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// GET /api/events/:id
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("eventType", "name label icon color")
      .populate("createdBy", "name email");
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// POST /api/events - Admin only
export const createEvent = async (req, res) => {
  try {
    const { name, description, eventType, bannerImage, thumbnailImage, startDate, endDate,
      discountPercentage, maxDiscountValue, minOrderValue, isPublic, isFeatured, tags } = req.body;

    if (!name || !eventType || !startDate || !endDate) {
      return res.status(400).json({ message: "Tên, loại sự kiện, ngày bắt đầu và kết thúc là bắt buộc" });
    }

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start <= now) {
      return res.status(400).json({ message: "Ngày bắt đầu phải lớn hơn thời điểm hiện tại" });
    }
    if (end <= start) {
      return res.status(400).json({ message: "Ngày kết thúc phải lớn hơn ngày bắt đầu" });
    }

    const event = await Event.create({
      name, description, eventType, bannerImage, thumbnailImage,
      startDate: start, endDate: end,
      discountPercentage, maxDiscountValue, minOrderValue,
      isPublic, isFeatured, tags,
      createdBy: req.user._id,
    });

    await event.populate("eventType", "name label icon color");
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// PUT /api/events/:id - Admin only
export const updateEvent = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    // Prevent updating slug manually through API
    delete req.body.slug;

    const existingEvent = await Event.findById(req.params.id);
    if (!existingEvent) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (startDate || endDate) {
      const now = new Date();
      const start = startDate ? new Date(startDate) : existingEvent.startDate;
      const end = endDate ? new Date(endDate) : existingEvent.endDate;

      // Only check if startDate is > now if it's actually BEING CHANGED and the event hasn't started yet
      if (startDate && new Date(startDate).getTime() !== new Date(existingEvent.startDate).getTime()) {
          if (new Date(startDate) <= now && existingEvent.startDate > now) {
            return res.status(400).json({ message: "Ngày bắt đầu mới phải lớn hơn thời điểm hiện tại" });
          }
      }
      
      if (start && end && end <= start) {
        return res.status(400).json({ message: "Ngày kết thúc phải lớn hơn ngày bắt đầu" });
      }
    }

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("eventType", "name label icon color");

    // Always sync ProductEvent prices if discountPercentage is provided (or force it on every save for consistency)
    if (req.body.hasOwnProperty('discountPercentage')) {
        const currentDiscount = req.body.discountPercentage;
        const productEvents = await ProductEvent.find({ event: event._id });
        for (const pe of productEvents) {
            const newEventPrice = Math.round(pe.originalPrice * (1 - currentDiscount / 100));
            await ProductEvent.findByIdAndUpdate(pe._id, { 
                eventPrice: newEventPrice,
                discountPercentage: currentDiscount 
            });
        }
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// DELETE /api/events/:id - Admin only
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    // Also remove related product registrations
    await ProductEvent.deleteMany({ event: req.params.id });
    res.json({ message: "Đã xóa sự kiện và các đăng ký sản phẩm liên quan" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
