import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import "../main"; // index.css chứa @tailwind base/components/utilities

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(form);
      alert("Đăng ký thành công 🎉");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-gray-50">
      {/* Left side */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-gray-900 via-black to-gray-800 items-center justify-center text-white relative overflow-hidden">
        {/* Subtle gold glow effect */}
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
        <div className="text-center px-12 z-10">
          <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            Fashion With Petrolimex
          </h1>
          <p className="text-lg text-gray-300">
            Tạo tài khoản để bắt đầu hành trình mua sắm thời trang đẳng cấp
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-3xl shadow-2xl shadow-gray-200 w-full max-w-md border border-gray-100"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Đăng ký
            </h2>
            <p className="text-gray-500 mt-2">Điền thông tin để tạo tài khoản mới</p>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              name="name"
              placeholder="Nhập tên của bạn"
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-gray-50"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              placeholder="Nhập email của bạn"
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-gray-50"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-gray-50"
            />
          </div>

          {/* Register button */}
          <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold p-3 rounded-xl hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30 transition-all transform hover:-translate-y-0.5 mb-6">
            Đăng ký tài khoản
          </button>

          {/* Register link */}
          <p className="text-center text-gray-600">
            Đã có tài khoản?{" "}
            <a
              href="/login"
              className="text-amber-600 font-bold hover:text-amber-700 hover:underline transition-colors"
            >
              Đăng nhập
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}