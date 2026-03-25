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

export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.addresses || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const { receiverName, phone, street, ward, district, city, isDefault } = req.body;
    const user = await User.findById(req.user.id);

    if (isDefault) {
      user.addresses.forEach(addr => (addr.isDefault = false));
    }

    user.addresses.push({ receiverName, phone, street, ward, district, city, isDefault });
    
    // Nếu là địa chỉ đầu tiên, tự động đặt làm mặc định
    if (user.addresses.length === 1) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ message: "Thêm địa chỉ thành công 🏠", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) return res.status(404).json({ message: "Không tìm thấy địa chỉ" });

    const deletedIsDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    if (deletedIsDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ message: "Đã xóa địa chỉ", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { receiverName, phone, street, ward, district, city, isDefault } = req.body;
    const user = await User.findById(req.user.id);

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ message: "Không tìm thấy địa chỉ" });

    if (isDefault) {
      user.addresses.forEach(addr => (addr.isDefault = false));
    }

    address.receiverName = receiverName || address.receiverName;
    address.phone = phone || address.phone;
    address.street = street || address.street;
    address.ward = ward || address.ward;
    address.district = district || address.district;
    address.city = city || address.city;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();
    res.json({ message: "Cập nhật địa chỉ thành công", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};