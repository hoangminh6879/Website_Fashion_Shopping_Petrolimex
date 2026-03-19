import User from "../models/User.model.js";

export const requestSeller = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role === "seller") {
      return res.status(400).json({ message: "Bạn đã là seller" });
    }

    user.isSellerRequested = true;
    await user.save();

    res.json({ message: "Đã gửi yêu cầu lên seller 🚀" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    user.role = "seller";
    user.isSellerRequested = false;

    await user.save();

    res.json({ message: "Duyệt thành công 🎉" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};