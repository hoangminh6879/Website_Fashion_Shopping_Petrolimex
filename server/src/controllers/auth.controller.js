import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có tối thiểu 6 ký tự" });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất 1 chữ số" });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất 1 chữ in hoa" });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ message: "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt" });
    }
    if (/\s/.test(password)) {
      return res.status(400).json({ message: "Mật khẩu không được chứa khoảng trắng" });
    }

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

    // 1.1 Kiểm tra xem bị Admin cấm không
    if (user.adminLockUntil && user.adminLockUntil > Date.now()) {
      const remainingDays = Math.ceil((user.adminLockUntil - Date.now()) / (1000 * 60 * 60 * 24));
      return res.status(403).json({ 
        message: `Tài khoản của bạn đã bị khóa bởi Quản trị viên trong ${remainingDays} ngày tới. Lý do: ${user.adminLockReason || 'Vi phạm chính sách'}` 
      });
    }

    // 1.2 Kiểm tra nếu tài khoản đang bị khóa (brute force)
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60 * 60)); // Tính giờ còn lại
      return res.status(403).json({ 
        message: `Tài khoản đã bị khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau ${remainingTime} giờ.` 
      });
    }

    // 2. so sánh password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Tăng số lần thử sai
      user.loginAttempts += 1;
      
      // Nếu sai 5 lần liên tiếp -> Khóa 24 giờ
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();
        return res.status(403).json({ 
          message: "Bạn đã nhập sai mật khẩu 5 lần. Tài khoản đã bị khóa trong 24 giờ tới." 
        });
      }

      await user.save();
      return res.status(401).json({ 
        message: `Sai mật khẩu. Bạn còn ${5 - user.loginAttempts} lần thử nữa.`,
        remainingAttempts: 5 - user.loginAttempts
      });
    }

    // Nếu đúng mật khẩu -> Reset bộ đếm
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

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

/**
 * Hàm gọi sau khi Google xác thực thành công.
 * Sẽ tạo JWT Token và điều hướng (Redirect) về frontend kèm token.
 */
export const googleSuccess = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Xác thực Google không thành công." });
    }

    // Tạo JWT Token cho người dùng đăng nhập bằng Google
    const userPayload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES,
    });

    // Chuyển hướng về phía React app cùng với token trong URL
    // (Lưu ý: Bạn có thể cấu hình frontendUrl này trong file .env nếu cần)
    const frontendUrl = "http://localhost:5173";

    // Redirect về route trung gian của frontend để lưu token vào localStorage
    res.redirect(`${frontendUrl}/login-success?token=${token}`);

  } catch (error) {
    console.error("Lỗi Google Success Callback:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xử lý kết quả Google Login" });
  }
};

// @desc    Gửi email reset mật khẩu
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng với email này" });
    }

    // 1. Tạo token reset mật khẩu ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Lưu token vào database (đã hash để bảo mật)
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 3. Thời gian hết hạn (10 phút)
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // 4. Gửi email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.
      Vui lòng nhấn vào đường link dưới đây để hoàn tất quy trình:
      ${resetUrl}

      Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ vẫn không thay đổi.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Đặt lại mật khẩu - Petrolimex Fashion",
        message,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Yêu cầu đặt lại mật khẩu</h2>
            <p>Xin chào ${user.name},</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Petrolimex Fashion của mình.</p>
            <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu mới. Liên kết này sẽ hết hạn sau 10 phút.</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">Đặt lại mật khẩu</a>
            <p style="margin-top: 20px; font-size: 12px; color: #777;">Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể an tâm bỏ qua email này.</p>
          </div>
        `,
      });

      res.status(200).json({ message: "Email đã được gửi thành công" });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      console.error(error);
      return res.status(500).json({ message: "Không thể gửi email. Vui lòng thử lại sau." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Đặt lại mật khẩu mới
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    // 1. Lấy token đã hash từ params
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // 2. Tìm user có token hợp lệ và chưa hết hạn
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // 3. Cập nhật mật khẩu mới
    const { password } = req.body;
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Đổi mật khẩu (khi đã đăng nhập)
// @route   POST /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Nếu user đăng nhập bằng Google và chưa có mật khẩu
    if (!user.password && user.googleId) {
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      return res.status(200).json({ message: "Đã thiết lập mật khẩu thành công" });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
    }

    // Hash mật khẩu mới
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
