import Image from "../models/Image.model.js";
import fs from "fs";
import path from "path";

// 🔥 UPLOAD ẢNH & LƯU VÀO DB
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có tệp nào được tải lên" });
    }

    const { productId, altText, isPrimary } = req.body;

    const imageUrl = `/uploads/${req.file.filename}`;

    const newImage = await Image.create({
      url: imageUrl,
      product: productId || null,
      altText: altText || "",
      isPrimary: isPrimary === "true" || isPrimary === true,
    });

    res.status(201).json({
      message: "Tải lên thành công",
      image: newImage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 XÓA ẢNH (FILE + DB)
export const deleteImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: "Không tìm thấy ảnh" });
    }

    // Xóa file vật lý
    const filePath = path.join(process.cwd(), "public", image.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Xóa trong DB
    await Image.findByIdAndDelete(req.params.id);

    res.json({ message: "Đã xóa ảnh thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
