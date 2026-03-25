import EventType from "../models/EventType.model.js";

// GET /api/event-types - Public
export const getEventTypes = async (req, res) => {
  try {
    const types = await EventType.find().sort({ createdAt: -1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// GET /api/event-types/:id
export const getEventTypeById = async (req, res) => {
  try {
    const type = await EventType.findById(req.params.id);
    if (!type) return res.status(404).json({ message: "Không tìm thấy loại sự kiện" });
    res.json(type);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// POST /api/event-types - Admin only
export const createEventType = async (req, res) => {
  try {
    const { name, label, description, icon, color } = req.body;
    if (!name || !label) return res.status(400).json({ message: "Tên và nhãn là bắt buộc" });

    const existing = await EventType.findOne({ name: name.toUpperCase() });
    if (existing) return res.status(400).json({ message: "Loại sự kiện này đã tồn tại" });

    const eventType = await EventType.create({
      name: name.toUpperCase(),
      label,
      description,
      icon,
      color,
    });
    res.status(201).json(eventType);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// PUT /api/event-types/:id - Admin only
export const updateEventType = async (req, res) => {
  try {
    const type = await EventType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!type) return res.status(404).json({ message: "Không tìm thấy loại sự kiện" });
    res.json(type);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// DELETE /api/event-types/:id - Admin only
export const deleteEventType = async (req, res) => {
  try {
    const type = await EventType.findByIdAndDelete(req.params.id);
    if (!type) return res.status(404).json({ message: "Không tìm thấy loại sự kiện" });
    res.json({ message: "Đã xóa loại sự kiện" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
