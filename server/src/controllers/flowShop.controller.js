import FlowShop from "../models/FlowShop.model.js";
import Shop from "../models/Shop.model.js";

export const toggleFollowShop = async (req, res) => {
  try {
    const { shopId } = req.body;
    const userId = req.user.id;

    const existingFollow = await FlowShop.findOne({ user: userId, shop: shopId });

    if (existingFollow) {
      await FlowShop.findByIdAndDelete(existingFollow._id);
      return res.json({ message: "Đã bỏ theo dõi shop", followed: false });
    } else {
      await FlowShop.create({ user: userId, shop: shopId });
      return res.status(201).json({ message: "Đã theo dõi shop", followed: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFollowedShops = async (req, res) => {
  try {
    const userId = req.user.id;
    const follows = await FlowShop.find({ user: userId }).populate("shop");
    const shops = follows.map(f => f.shop).filter(s => s != null);
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkFollowStatus = async (req, res) => {
  try {
    const { shopId } = req.params;
    const userId = req.user.id;
    const follow = await FlowShop.findOne({ user: userId, shop: shopId });
    res.json({ followed: !!follow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
