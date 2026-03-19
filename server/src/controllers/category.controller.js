import Category from "../models/Category.model.js";
import Product from "../models/Product.model.js";

export const createCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;

    const category = await Category.create({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      parent: parent || null,
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("parent");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate("parent");

    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        parent: parent || null,
      },
      { new: true }
    );

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // 🔥 set category = null cho product
    await Product.updateMany(
      { category: categoryId },
      { $set: { category: null } }
    );

    // 🧨 xóa category
    await Category.findByIdAndDelete(categoryId);

    res.json({
      message: "Đã xóa category và giữ nguyên product ✅",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

