import { useState } from "react";
import { forgotPassword } from "../services/authService";
import Swal from "sweetalert2";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword({ email });
            Swal.fire({
                icon: "success",
                title: "Thành công!",
                text: "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.",
                confirmButtonColor: "#f97316",
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Lỗi!",
                text: err.response?.data?.message || "Có lỗi xảy ra khi gửi email!",
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
                    <h2 className="text-3xl font-bold text-gray-900">Quên mật khẩu?</h2>
                    <p className="text-gray-500 mt-2">
                        Nhập email của bạn để nhận liên kết đặt lại mật khẩu
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn"
                        required
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-gray-50"
                    />
                </div>

                <button
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold p-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 ${loading ? "opacity-50 cursor-not-allowed" : "hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30"
                        }`}
                >
                    {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
                </button>

                <p className="text-center text-gray-600 mt-8">
                    Quay lại{" "}
                    <a href="/login" className="text-amber-600 font-bold hover:text-amber-700">
                        Đăng nhập
                    </a>
                </p>
            </form>
        </div>
    );
}
