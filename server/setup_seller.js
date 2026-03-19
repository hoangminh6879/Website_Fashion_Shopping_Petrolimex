import mongoose from "mongoose";
import User from "./src/models/User.model.js";
import Shop from "./src/models/Shop.model.js";
import dotenv from "dotenv";

dotenv.config();

const userId = "69bbf47ffd6b6569ed35b507"; // ID chính xác từ MongoDB

async function setup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Cập nhật role cho user
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found!");
      process.exit(1);
    }

    user.role = "seller";
    await user.save();
    console.log(`User ${user.name} role updated to 'seller'`);

    // 2. Tạo shop nếu chưa có
    let shop = await Shop.findOne({ owner: userId });
    if (!shop) {
      shop = await Shop.create({
        name: `${user.name} Fashion Store`,
        description: "Cửa hàng thời trang chính hãng Petrolimex",
        owner: userId,
        address: "TP. Hồ Chí Minh",
        phone: user.phone || "0123456789"
      });
      console.log(`Shop '${shop.name}' created for ${user.name}`);
    } else {
      console.log(`Shop '${shop.name}' already exists for ${user.name}`);
    }

    console.log("--- SETUP COMPLETE ---");
    console.log("Bây giờ bạn hãy đăng xuất và đăng nhập lại trên trình duyệt để cập nhật token mới.");
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setup();
