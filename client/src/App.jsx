import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail"; // 🔥 thêm
import SellerDashboard from "./pages/SellerDashboard";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />

        {/* 🔥 QUAN TRỌNG */}
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;