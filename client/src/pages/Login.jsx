import { useState } from "react";
import { loginUser } from "../services/authService";
import "../main"; // index.css chứa @tailwind base/components/utilities
import Swal from "sweetalert2";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(form);
      localStorage.setItem("token", res.data.token);

      const userRole = res.data.user.role;

      Swal.fire({
        icon: "success",
        title: "Tuyệt vời!",
        text: "Đăng nhập thành công",
        confirmButtonColor: "#f97316",
      }).then(() => {
        if (userRole === "admin") {
          window.location.href = "/admin/dashboard";
        } else if (userRole === "seller") {
          window.location.href = "/seller/dashboard";
        } else {
          window.location.href = "/";
        }
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: err.response?.data?.message || "Có lỗi xảy ra!",
        confirmButtonColor: "#f97316",
      });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-gray-50">
      {/* Left side */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-gray-900 via-black to-gray-800 items-center justify-center text-white relative overflow-hidden">
        {/* Subtle gold glow effect */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        <div className="text-center px-12 z-10">
          <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            Chào mừng trở lại!
          </h1>
          <p className="text-lg text-gray-300">
            Đăng nhập để tiếp tục trải nghiệm tuyệt vời cùng Petrolimex Fashion
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
              Đăng nhập
            </h2>
            <p className="text-gray-500 mt-2">Vui lòng nhập thông tin của bạn</p>
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

          {/* Login button */}
          <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold p-3 rounded-xl hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30 transition-all transform hover:-translate-y-0.5 mb-6">
            Đăng nhập
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-400 bg-white">hoặc tiếp tục với</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Social login */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl p-3 hover:bg-gray-50 transition-all text-gray-700 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Google
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl p-3 hover:bg-gray-50 transition-all text-gray-700 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          {/* Register link */}
          <p className="text-center text-gray-600 mt-8">
            Chưa có tài khoản?{" "}
            <a
              href="/register"
              className="text-amber-600 font-bold hover:text-amber-700 hover:underline transition-colors"
            >
              Đăng ký ngay
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}