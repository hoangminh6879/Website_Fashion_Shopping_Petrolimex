import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

/**
 * Trang trung gian để xử lý Token sau khi Google Login quay trở lại.
 */
export default function LoginSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Lấy token từ thanh URL (?token=...)
        const token = searchParams.get("token");

        if (token) {
            // 1. Lưu token vào bộ nhớ trình duyệt
            localStorage.setItem("token", token);

            // 2. Hiện thông báo thành công
            Swal.fire({
                icon: "success",
                title: "Đăng nhập Google thành công!",
                text: "Chào mừng bạn quay trở lại Petrolimex Fashion",
                timer: 1500,
                showConfirmButton: false,
                timerProgressBar: true,
            }).then(() => {
                // 3. Quay về trang chủ
                // Sử dụng window.location.href để reload hoàn toàn trạng thái authentication
                window.location.href = "/";
            });
        } else {
            // Nếu không có token, quay lại trang login
            navigate("/login");
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
                {/* Loading spinner */}
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang xác thực tài khoản</h2>
                <p className="text-gray-500">Vui lòng đợi trong giây lát...</p>
            </div>
        </div>
    );
}
