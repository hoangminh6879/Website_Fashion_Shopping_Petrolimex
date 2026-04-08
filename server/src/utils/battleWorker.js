import Battle from "../models/Battle.model.js";
import BattleVote from "../models/BattleVote.model.js";
import Product from "../models/Product.model.js";

// Chạy mỗi 1 phút để kiểm tra
export const startBattleWorker = () => {
  setInterval(async () => {
    try {
      const now = new Date();
      // Tìm các trận battle đã hết hạn nhưng vẫn đang ở trạng thái 'ongoing'
      const expiredBattles = await Battle.find({ status: "ongoing", endTime: { $lte: now } });

      for (const battle of expiredBattles) {
        // Đếm số phiếu bầu
        const votes = await BattleVote.aggregate([
          { $match: { battle: battle._id } },
          { $group: { _id: "$product", count: { $sum: 1 } } }
        ]);

        let maxVotes = 0;
        let winners = [];

        votes.forEach(v => {
          if (v.count > maxVotes) {
            maxVotes = v.count;
            winners = [v._id];
          } else if (v.count === maxVotes) {
            winners.push(v._id);
          }
        });

        // Nếu không có ai vote, chọn tất cả hoặc không chọn ai? Ở đây sẽ chọn tất cả hoặc không xử lý
        if (maxVotes === 0) {
          winners = battle.products; // Giả sử nếu không ai vote thì coi như tất cả cùng hạng nhất 0 phiếu
        }

        battle.status = "ended";
        battle.winnerProducts = winners;
        await battle.save();

        // Áp dụng giảm giá cho TẤT CẢ các sản phẩm hòa giải nhất (hoặc 1 sản phẩm nếu không có ai hòa)
        for (const productId of winners) {
          const product = await Product.findById(productId);
          if (product) {
            product.isFlashSale = true;
            product.discountPercentage = battle.discountPercentage;
            // Tính toán giá mới
            product.flashSalePrice = Math.round(product.price * (1 - (battle.discountPercentage) / 100));
            // Kéo dài vô thời hạn
            product.flashSaleEndDate = null; 
            await product.save();
          }
        }
        
        console.log(`[Battle Worker] Trận battle "${battle.name}" đã kết thúc. Sản phẩm thắng: ${winners.join(", ")}`);
      }
    } catch (error) {
      console.error("[Battle Worker] Lỗi:", error);
    }
  }, 60 * 1000); // 1 phút
};
