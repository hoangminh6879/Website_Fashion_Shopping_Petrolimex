import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import User from "./src/models/User.model.js";
import authRoutes from "./src/routes/auth.routes.js";// test dang ky va dang nhap
import { protect } from "./src/middlewares/auth.middleware.js"; //test bao ve api
import { authorizeRoles } from "./src/middlewares/role.middleware.js"; //test phan quyen
import userRoutes from "./src/routes/user.routes.js"; // test user gui yeu cau len seller va admin duyệt yêu cầu đó
import shopRoutes from "./src/routes/shop.routes.js"; // test seller tao shop, chi seller moi tao duoc va chi duoc tao 1 shop, neu da co shop roi thi bao loi
import productRoutes from "./src/routes/product.routes.js";// test seller tao san pham, chi seller moi tao duoc, va chi tao duoc san pham trong shop cua minh, neu khong se bao loi, admin va user khong tao duoc san pham, admin va user chi xem duoc san pham va chi tiet san pham, seller co the cap nhat va xoa san pham cua minh, khong cap nhat va xoa san pham cua nguoi khac, admin va user khong cap nhat va xoa san pham
import categoryRoutes from "./src/routes/category.routes.js";
import imageRoutes from "./src/routes/image.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import couponTypeRoutes from "./src/routes/couponType.routes.js";
import couponRoutes from "./src/routes/coupon.routes.js";
import flowShopRoutes from "./src/routes/flowShop.routes.js";
import path from "path";



import cors from "cors";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

app.get("/api", (req, res) => {
  res.send("API OK");
});

app.get("/", (req, res) => {
  res.send("API running...");
});

app.get("/test-user", async (req, res) => {
  const user = await User.create({
    name: "Minh",
    email: "minh@gmail.com",
    password: "123456",
  });

  res.json(user);
});//test tao user de test dang nhap va bao ve api

app.get("/api/profile", protect, (req, res) => {
  res.json({
    message: "Đây là dữ liệu protected",
    user: req.user,
  });
});//test middleware bao ve api

app.get(
  "/api/admin",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Hello Admin 👑" });
  }
);//test middleware phan quyen admin

app.get(
  "/api/seller",
  protect,
  authorizeRoles("seller"),
  (req, res) => {
    res.json({ message: "Hello Seller 🛒" });
  }
);//test middleware phan quyen seller

app.get(
  "/api/user",
  protect,
  authorizeRoles("user", "seller", "admin"),
  (req, res) => {
    res.json({ message: "Hello User 👤" });
  }
);//test middleware phan quyen user

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coupon-types", couponTypeRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/flows", flowShopRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));