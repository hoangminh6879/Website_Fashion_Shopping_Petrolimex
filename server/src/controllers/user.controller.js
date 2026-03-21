import User from "../models/User.model.js";

export const requestSeller = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role === "seller") {
      return res.status(400).json({ message: "Bạn đã là seller" });
    }

    const { reason, proofImage } = req.body;
    if (!reason || !proofImage) {
      return res.status(400).json({ message: "Vui lòng cung cấp lý do và ảnh minh chứng" });
    }

    user.sellerRequest = {
      status: "pending",
      reason,
      proofImage
    };
    await user.save();

    res.json({ message: "Đã gửi yêu cầu lên seller 🚀", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { action } = req.body; // 'approve' hoặc 'reject'

    if (action === 'approve') {
      user.role = "seller";
      if (user.sellerRequest) user.sellerRequest.status = "approved";
    } else if (action === 'reject') {
      if (user.sellerRequest) user.sellerRequest.status = "rejected";
    }

    await user.save();

    res.json({ message: action === 'approve' ? "Duyệt thành công 🎉" : "Đã từ chối yêu cầu", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};