import User from '../models/User.model.js';

export const startTierResetWorker = () => {
    console.log("🛠️ Starting Tier Reset Worker...");

    const checkAndResetTiers = async () => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Tìm những user có loyaltyCycleStart quá 30 ngày
            const usersToReset = await User.find({
                loyaltyCycleStart: { $lte: thirtyDaysAgo }
            });

            if (usersToReset.length > 0) {
                console.log(`🔄 Found ${usersToReset.length} users to reset their loyalty tiers.`);
                
                for (const user of usersToReset) {
                    user.loyaltyPoints = 0;
                    user.customerTier = "thường";
                    user.loyaltyCycleStart = new Date(); // Khởi tạo chu kỳ mới
                    await user.save();
                }
                
                console.log(`✅ Successfully reset tiers for ${usersToReset.length} users.`);
            }
        } catch (error) {
            console.error("❌ Error in Tier Reset Worker:", error);
        }
    };

    // Chạy kiểm tra ngay khi khởi động worker
    checkAndResetTiers();

    // Thiết lập chạy định kỳ (Ví dụ: Chạy mỗi 12 giờ)
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    setInterval(checkAndResetTiers, TWELVE_HOURS);
};
