import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import UserAccount from "../models/User.model.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Cấu hình các thông số cho Google Strategy
 */
const googleAuthOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CLIENT_CALLBACK_URL,
};

/**
 * Hàm xử lý sau khi Google xác thực thành công và trả về thông tin profile
 */
const verifyGoogleUser = async (accessToken, refreshToken, profile, done) => {
    try {
        const googleId = profile.id;
        const userEmail = profile.emails[0].value;
        const userName = profile.displayName;
        const userAvatar = profile.photos[0].value;

        // 1. Kiểm tra xem người dùng đã từng đăng nhập bằng Google ID này chưa
        let currentUser = await UserAccount.findOne({ googleId: googleId });

        if (currentUser) {
            console.log("Tìm thay user bằng Google ID:", currentUser.email);
            return done(null, currentUser);
        }

        // 2. Nếu chưa có Google ID, kiểm tra xem Email đã tồn tại trong hệ thống chưa
        currentUser = await UserAccount.findOne({ email: userEmail });

        if (currentUser) {
            // Nếu đã có email (đã đăng ký trước đó bằng mật khẩu), thì cập nhật Google ID vào tài khoản này
            console.log("User đã có email, đang liên kết với Google ID...");
            currentUser.googleId = googleId;
            currentUser.avatar = currentUser.avatar || userAvatar; // Cập nhật ảnh đại diện nếu chưa có
            await currentUser.save();
            return done(null, currentUser);
        }

        // 3. Nếu chưa có tài khoản nào cả, tạo mới tài khoản dựa trên thông tin Google
        console.log("Tạo tài khoản mới từ Google...");
        const newUser = await UserAccount.create({
            name: userName,
            email: userEmail,
            googleId: googleId,
            avatar: userAvatar,
            isVerified: true // Mặc định từ Google là đã xác thực email
        });

        return done(null, newUser);

    } catch (error) {
        console.error("Lỗi xác thực Google:", error);
        return done(error, null);
    }
};

// Sử dụng chiến lược xác thực Google
passport.use(new GoogleStrategy(googleAuthOptions, verifyGoogleUser));

// Các hàm hỗ trợ cho Session (Dù dùng JWT vẫn cần khai báo cơ bản để Passport hoạt động)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserAccount.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
