import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, userRole, isInitialized } = useCart();

    // Đợi khởi tạo user xong
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    // Chưa đăng nhập
    if (!user || userRole === 'guest') {
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra quyền
    if (!allowedRoles.includes(userRole)) {
        // Thông báo không có quyền
        Swal.fire({
            icon: 'error',
            title: 'Truy cập bị từ chối',
            text: 'Bạn không có quyền truy cập vào trang này!',
            confirmButtonColor: '#f59e0b',
        });

        // Điều hướng về trang chủ
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
