import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import Swal from "sweetalert2";
import "../main"; // index.css chứa @tailwind base/components/utilities

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const validatePassword = (password) => {
    if (password.length < 6) return "Mật khẩu phải có tối thiểu 6 ký tự.";
    if (!/[0-9]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ số.";
    if (!/[A-Z]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ in hoa.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.";
    if (/\s/.test(password)) return "Mật khẩu không được chứa khoảng trắng.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for empty fields
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Thông báo",
        text: "Các trường không được bỏ trống!",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    // Email validation
    if (!validateEmail(form.email)) {
      Swal.fire({
        icon: "error",
        title: "Lỗi định dạng",
        text: "Email không đúng định dạng. Vui lòng nhập lại!",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }
    
    const passwordError = validatePassword(form.password);
    if (passwordError) {
      Swal.fire({
        icon: "warning",
        title: "Lỗi mật khẩu",
        text: passwordError,
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Lỗi xác nhận",
        text: "Mật khẩu xác nhận không khớp!",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    try {
      await registerUser({ name: form.name, email: form.email, password: form.password });
      
      Swal.fire({
        icon: "success",
        title: "Đăng ký thành công",
        text: "Chúc mừng! Bạn đã đăng ký tài khoản thành công 🎉",
        confirmButtonColor: "#10b981",
      }).then(() => {
        navigate("/login");
      });

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Đăng ký thất bại",
        text: err.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại sau.",
        confirmButtonColor: "#ef4444",
      });
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

      <div className="flex w-full md:w-1/2 items-center justify-center p-6 bg-white overflow-y-auto min-h-screen">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 md:p-10 rounded-3xl w-full max-w-md my-auto"
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-gray-50 mb-3"
            />
            
            {/* Password constraints checklist */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Yêu cầu mật khẩu:</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className={`flex items-center gap-2 transition-colors ${form.password.length >= 6 ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span className="text-lg leading-none">{form.password.length >= 6 ? '✓' : '○'}</span>
                  <span>Tối thiểu 6 ký tự</span>
                </div>
                <div className={`flex items-center gap-2 transition-colors ${/[0-9]/.test(form.password) ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span className="text-lg leading-none">{/[0-9]/.test(form.password) ? '✓' : '○'}</span>
                  <span>Chứa ít nhất 1 chữ số</span>
                </div>
                <div className={`flex items-center gap-2 transition-colors ${/[A-Z]/.test(form.password) ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span className="text-lg leading-none">{/[A-Z]/.test(form.password) ? '✓' : '○'}</span>
                  <span>Chứa ít nhất 1 chữ in hoa</span>
                </div>
                <div className={`flex items-center gap-2 transition-colors ${/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span className="text-lg leading-none">{/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? '✓' : '○'}</span>
                  <span>Chứa ít nhất 1 ký tự đặc biệt</span>
                </div>
                <div className={`flex items-center gap-2 transition-colors ${form.password.length > 0 && !/\s/.test(form.password) ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span className="text-lg leading-none">{form.password.length > 0 && !/\s/.test(form.password) ? '✓' : '○'}</span>
                  <span>Không chứa khoảng trắng</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-gray-50 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-1 font-medium">Mật khẩu xác nhận không khớp!</p>
            )}
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