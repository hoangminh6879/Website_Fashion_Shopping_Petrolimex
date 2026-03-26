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
import EventDetail from "./pages/EventDetail"; // 🔥 thêm
import LoginSuccess from "./pages/LoginSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-success" element={<LoginSuccess />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes for All Logged-in Users */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['user', 'seller', 'admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* User Only Routes (Shopping logic) */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/followed-shops"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <FollowedShops />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <OrderHistory />
            </ProtectedRoute>
          }
        />

        {/* Seller Only Routes */}
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/shop/:id" element={<ShopDetail />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/flash-sale" element={<FlashSalePage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;