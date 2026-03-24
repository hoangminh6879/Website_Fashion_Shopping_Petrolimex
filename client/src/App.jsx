import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail"; // 🔥 thêm
import SellerDashboard from "./pages/SellerDashboard";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/AdminDashboard";
import ShopDetail from "./pages/ShopDetail"; // 🔥 thêm
import FollowedShops from "./pages/FollowedShops";
import Wishlist from "./pages/Wishlist";
import FlashSalePage from "./pages/FlashSalePage";
import LoginSuccess from "./pages/LoginSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-success" element={<LoginSuccess />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<Cart />} />

        {/* 🔥 QUAN TRỌNG */}
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/shop/:id" element={<ShopDetail />} />
        <Route path="/followed-shops" element={<FollowedShops />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/flash-sale" element={<FlashSalePage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;