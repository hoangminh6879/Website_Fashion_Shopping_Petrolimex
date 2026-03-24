import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";
import Swal from "sweetalert2";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            return Swal.fire({
                icon: "error",
                title: "Lỗi!",
                text: "Mật khẩu không khớp!",
                confirmButtonColor: "#f97316",
            });
        }

        setLoading(true);
        try {
            await resetPassword(token, { password: form.password });
            Swal.fire({
                icon: "success",
                title: "Thành công!",
                text: "Mật khẩu đã được đặt lại thành công!",
                confirmButtonColor: "#f97316",
            }).then(() => {
                navigate("/login");
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Lỗi!",
                text: err.response?.data?.message || "Có lỗi xảy ra khi đặt lại mật khẩu!",
                confirmButtonColor: "#f97316",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 font-sans">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-10 rounded-3xl shadow-2xl shadow-gray-200 w-full max-w-md border border-gray-100"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
                    <p className="text-gray-500 mt-2">Nhập mật khẩu mới cho tài khoản của bạn</p>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        required
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-gray-50"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        required
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-gray-50"
                    />
                </div>

                <button
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold p-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 ${loading ? "opacity-50 cursor-not-allowed" : "hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30"
                        }`}
                >
                    {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>
            </form>
        </div>
    );
}
