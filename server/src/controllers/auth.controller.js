import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // kiểm tra email tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // tạo user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. kiểm tra user tồn tại
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    // 2. so sánh password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    // 3. tạo token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role, // chuẩn bị cho phân quyền
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES,
      }
    );

    // 4. trả về kết quả
    res.json({
      message: "Đăng nhập thành công",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address, avatar },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};