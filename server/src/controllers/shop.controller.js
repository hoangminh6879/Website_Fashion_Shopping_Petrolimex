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
      status: "pending"
    });

    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) {
      return res.status(404).json({ message: "Không tìm thấy shop" });
    }
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: "Không tìm thấy shop" });
    }
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const updateShop = async (req, res) => {
  try {
    const { name, description, address, phone, fanpage } = req.body;
    const shop = await Shop.findOneAndUpdate(
      { owner: req.user.id },
      { name, description, address, phone, fanpage },
      { new: true }
    );
    if (!shop) {
      return res.status(404).json({ message: "Không tìm thấy shop" });
    }
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};