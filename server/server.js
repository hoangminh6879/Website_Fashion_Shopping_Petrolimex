import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import User from "./src/models/User.model.js";
import authRoutes from "./src/routes/auth.routes.js";// test dang ky va dang nhap
import { protect } from "./src/middlewares/auth.middleware.js"; //test bao ve api
import { authorizeRoles } from "./src/middlewares/role.middleware.js"; //test phan quyen



dotenv.config();
connectDB();

const app = express();

app.use(express.json());

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));