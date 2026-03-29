import Event from "../models/Event.model.js";
import ProductEvent from "../models/ProductEvent.model.js";

/**
 * Hàm kiểm tra và cập nhật trạng thái các sự kiện dựa trên thời gian thực
 */
export const checkEvents = async () => {
  try {
    const now = new Date();

    // 1. Tìm các sự kiện 'active' hoặc 'paused' nhưng đã quá hạn 'endDate'
    const expiredEvents = await Event.find({
      status: { $in: ["active", "paused"] },
      endDate: { $lte: now },
    });

    if (expiredEvents.length > 0) {
      console.log(`[EventWorker] Found ${expiredEvents.length} expired events. Updating...`);
      
      for (const event of expiredEvents) {
        event.status = "ended";
        await event.save();

        // Cập nhật tất cả ProductEvent thuộc sự kiện này sang trạng thái 'removed'
        // hoặc xóa hẳn tùy theo nhu cầu, ở đây tôi chọn set sang 'removed' để giữ lịch sử
        const updatedItems = await ProductEvent.updateMany(
            { event: event._id, status: { $ne: "removed" } },
            { status: "removed" }
        );

        console.log(`[EventWorker] Event "${event.name}" ended. ${updatedItems.modifiedCount} products removed.`);
      }
    }

    // 2. Tự động kích hoạt sự kiện 'draft' nếu đã đến 'startDate'
    const upcomingEvents = await Event.find({
      status: "draft",
      startDate: { $lte: now },
      endDate: { $gt: now },
    });

    if (upcomingEvents.length > 0) {
      console.log(`[EventWorker] Activating ${upcomingEvents.length} upcoming events...`);
      for (const event of upcomingEvents) {
        event.status = "active";
        await event.save();
        console.log(`[EventWorker] Event "${event.name}" is now ACTIVE!`);
      }
    }

  } catch (error) {
    console.error("[EventWorker ERROR]:", error);
  }
};

/**
 * Khởi chạy trình theo dõi sự kiện
 */
export const startEventWorker = () => {
    console.log("[EventWorker] Event monitoring service started.");
    
    // Chạy ngay lập tức khi khởi động server
    checkEvents();

    // Chạy định kỳ mỗi 5 phút (300.000 ms)
    setInterval(() => {
        checkEvents();
    }, 5 * 60 * 1000);
};
