import mongoose from "mongoose";
import Battle from "../models/Battle.model.js";
import BattleVote from "../models/BattleVote.model.js";
import Shop from "../models/Shop.model.js";
import Product from "../models/Product.model.js";

// -- SELLER APIS --

export const createBattle = async (req, res) => {
  try {
    const { name, products, discountPercentage, endTime } = req.body;

    if (!products || products.length < 2) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 2 sản phẩm." });
    }

    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) {
      return res.status(403).json({ message: "Bạn chưa có shop." });
    }

    // Xác nhận sản phẩm của shop
    const shopProducts = await Product.find({ _id: { $in: products }, shop: shop._id });
    if (shopProducts.length !== products.length) {
      return res.status(400).json({ message: "Sản phẩm không hợp lệ hoặc không thuộc về shop của bạn." });
    }

    const battle = await Battle.create({
      shop: shop._id,
      name,
      products,
      discountPercentage,
      endTime,
      status: "ongoing",
    });

    res.status(201).json({ message: "Tạo trận battle thành công!", battle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSellerBattles = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) {
      return res.status(403).json({ message: "Bạn chưa có shop." });
    }

    const battles = await Battle.find({ shop: shop._id })
      .populate("products", "name price images isFlashSale discountPercentage")
      .sort("-createdAt");

    res.json(battles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -- USER/PUBLIC APIS --

export const getOngoingBattles = async (req, res) => {
  try {
    const battles = await Battle.find({ status: "ongoing", endTime: { $gt: new Date() } })
      .populate({
        path: "shop",
        select: "name image",
      })
      .populate({
        path: "products",
        populate: { path: "images", select: "url" }
      })
      .sort("endTime");
    
    res.json(battles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBattleById = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id)
      .populate({
        path: "shop",
        select: "name image",
      })
      .populate({
        path: "products",
        populate: { path: "images", select: "url" }
      })
      .populate("winnerProducts");

    if (!battle) {
      return res.status(404).json({ message: "Không tìm thấy trận battle." });
    }

    // Đếm số lượt bình chọn cho từng sản phẩm
    const votes = await BattleVote.aggregate([
      { $match: { battle: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: "$product", count: { $sum: 1 } } }
    ]);

    const votesMap = {};
    let totalVotes = 0;
    votes.forEach(v => {
      votesMap[v._id.toString()] = v.count;
      totalVotes += v.count;
    });

    const productsWithVotes = battle.products.map(p => {
      const voteCount = votesMap[p._id.toString()] || 0;
      return {
        ...p.toObject(),
        voteCount,
        votePercentage: totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0,
      };
    });

    let hasVoted = false;
    let votedProductId = null;
    if (req.user) {
       const userVote = await BattleVote.findOne({ battle: battle._id, user: req.user.id });
       if (userVote) {
         hasVoted = true;
         votedProductId = userVote.product;
       }
    }

    res.json({
      ...battle.toObject(),
      products: productsWithVotes,
      hasVoted,
      votedProductId,
      totalVotes
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const voteBattle = async (req, res) => {
  try {
    const { productId } = req.body;
    const battleId = req.params.id;

    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ message: "Không tìm thấy trạng battle." });
    }

    if (battle.status !== "ongoing" || new Date() > battle.endTime) {
      return res.status(400).json({ message: "Trận battle đã kết thúc, không thể bình chọn." });
    }

    const productExists = battle.products.some(p => p.toString() === productId);
    if (!productExists) {
      return res.status(400).json({ message: "Sản phẩm không nằm trong trận battle này." });
    }

    const vote = await BattleVote.create({
      battle: battleId,
      user: req.user.id,
      product: productId,
    });

    res.status(201).json({ message: "Bình chọn thành công!", vote });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Bạn đã bình chọn cho trận battle này rồi." });
    }
    res.status(500).json({ message: error.message });
  }
};
