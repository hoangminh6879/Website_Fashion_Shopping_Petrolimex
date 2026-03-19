import Shop from "../models/Shop.model.js";

export const createShop = async (req, res) => {
  try {
    // kiểm tra đã có shop chưa
    const existingShop = await Shop.findOne({
      owner: req.user.id,
    });

    if (existingShop) {
      return res.status(400).json({ message: "Bạn đã có shop" });
    }

    const shop = await Shop.create({
      name: req.body.name,
      description: req.body.description,
      owner: req.user.id,
    });

    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};