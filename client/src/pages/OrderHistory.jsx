import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Swal from 'sweetalert2';

// ─── Order Details Modal ─────────────────────────────────────────────────────
function OrderModal({ order, onClose }) {
    if (!order) return null;

    const formatPrice = (price) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

    const getStatusInfo = (status) => {
        const map = {
            pending_payment: { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
            pending: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
            confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500' },
            paid: { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
            shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500' },
            delivered: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
            cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' }
        };
        return map[status] || map.pending;
    };

    const statusInfo = getStatusInfo(order.status);

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />

            {/* Modal Content */}
            <div
                className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-modalIn border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="px-10 py-8 bg-gray-900 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-3xl border border-white/10 backdrop-blur-sm">
                            🛍️
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black tracking-tighter uppercase italic">Chi Tiết <span className="text-amber-500">Đơn Hàng</span></h2>
                                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusInfo.color.replace('text-', 'text-white bg-opacity-20 ')} bg-white/10 border border-white/20`}>
                                    {statusInfo.label}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Mã vận đơn: #{order._id.slice(-12).toUpperCase()}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white font-bold hover:rotate-90 duration-300 border border-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-10">
                        {/* Summary Grid (Form style) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                            {/* Left Side: Product List & Detailed Breakdown */}
                            <div className="lg:col-span-7 space-y-8">
                                <div>
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        <span className="w-8 h-px bg-gray-200" /> Danh sách sản phẩm
                                    </h3>
                                    <div className="space-y-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-5 p-4 rounded-3xl border border-gray-50 bg-gray-50/30">
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100 flex-shrink-0">
                                                    <img
                                                        src={item.product?.images?.[0]?.url
                                                            ? (item.product.images[0].url.startsWith('http') ? item.product.images[0].url : `http://localhost:5000${item.product.images[0].url}`)
                                                            : `https://picsum.photos/seed/${idx}/150/150`}
                                                        className="w-full h-full object-cover"
                                                        alt={item.product?.name}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0 py-1">
                                                    <h4 className="font-black text-gray-900 text-sm uppercase truncate mb-1">{item.product?.name}</h4>
                                                    <div className="flex gap-2 mb-2">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Màu: {item.color}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-opacity-50">/</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Size: {item.size}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <p className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Số lượng: x{item.quantity}</p>
                                                        <p className="font-black text-gray-900 tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mb-16 -mr-16 blur-2xl" />
                                    <div className="space-y-3 relative z-10">
                                        <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                            <span>Tạm tính</span>
                                            <span>{formatPrice((order.totalPrice || 0) + (order.discountAmount || 0) - (order.shippingFee || 0))}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                                            <span>Tiết kiệm (Voucher)</span>
                                            <span>-{formatPrice(order.discountAmount || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                            <span>Phí vận chuyển</span>
                                            <span>+{formatPrice(order.shippingFee || 0)}</span>
                                        </div>
                                        <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center">
                                            <span className="text-sm font-black uppercase italic tracking-tighter">Tổng thanh toán</span>
                                            <span className="text-3xl font-black text-amber-500 tabular-nums italic">{formatPrice(order.totalPrice || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Customer & Shipping Form Style */}
                            <div className="lg:col-span-5 space-y-8">
                                <div>
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        <span className="w-8 h-px bg-gray-200" /> Thông tin đơn hàng
                                    </h3>

                                    <div className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Ngày đặt hàng</p>
                                            <p className="font-black text-gray-800 flex items-center gap-2">
                                                <span className="text-amber-500">📅</span>
                                                {new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Người nhận hàng</p>
                                            <p className="font-black text-gray-800 flex items-center gap-2 uppercase">
                                                <span className="text-amber-500">👤</span>
                                                {order.user?.name || 'Quý khách'}
                                            </p>
                                            <p className="text-xs font-bold text-gray-500 ml-6 tracking-wider">{order.phone}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Địa chỉ giao hàng</p>
                                            <div className="flex gap-2">
                                                <span className="text-amber-500 flex-shrink-0 mt-0.5">📍</span>
                                                <p className="font-bold text-gray-700 text-xs leading-relaxed italic">{order.address}</p>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Thanh toán</p>
                                                <p className="text-xs font-black text-gray-900 border-2 border-gray-900 px-3 py-1 rounded-lg inline-block uppercase tracking-tighter italic">
                                                    {order.paymentMethod}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Vận chuyển</p>
                                                <p className="text-xs font-black text-gray-900 uppercase">Tiêu chuẩn</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100 flex items-start gap-4 shadow-inner shadow-amber-200/10">
                                    <span className="text-2xl mt-1">🛡️</span>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider mb-1">Cam kết 7 ngày</p>
                                        <p className="text-[9px] font-bold text-amber-600/80 leading-relaxed uppercase">Sản phẩm lỗi? Hoặc không ưng ý? Chúng tôi sẵn sàng hỗ trợ đổi trả miễn phí trong vòng 7 ngày kể từ khi bạn nhận hàng.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="px-10 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-gray-900 text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-amber-500 hover:text-gray-900 transition-all text-[10px] shadow-xl shadow-gray-200"
                    >
                        Đóng cửa sổ
                    </button>
                    {order.status === 'pending' && (
                        <button className="px-10 py-4 bg-white border-2 border-gray-900 text-gray-900 font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-all text-[10px]">
                            Yêu cầu hủy đơn
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchOrders();
    }, []);

    // Hiển thị thông báo kết quả VNPay nếu có query params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const vnpay = params.get('vnpay');
        const orderId = params.get('orderId');

        if (vnpay === 'success') {
            Swal.fire({
                icon: 'success',
                title: 'Thanh toán VNPay thành công! 🎉',
                text: `Đơn hàng #${orderId?.slice(-6).toUpperCase() || ''} của bạn đã được thanh toán thành công.`,
                confirmButtonColor: '#111827',
                confirmButtonText: 'Tuyệt vời'
            });
            // Xóa query params để tránh hiện lại khi refresh
            window.history.replaceState(null, '', window.location.pathname);
        } else if (vnpay === 'fail') {
            const reason = params.get('reason');
            let errorMsg = 'Giao dịch không thành công. Vui lòng thử lại.';
            if (reason === '24') errorMsg = 'Giao dịch đã bị hủy bởi người dùng.';

            Swal.fire({
                icon: 'error',
                title: 'Thanh toán thất bại',
                text: errorMsg,
                confirmButtonColor: '#111827'
            });
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [location.search]);

    // Auto-open order details if orderId is in URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const orderId = params.get('orderId');
        if (orderId && orders.length > 0) {
            const order = orders.find(o => o._id === orderId);
            if (order) {
                setSelectedOrder(order);
                // Clear the query param without refreshing page if you want
                // window.history.replaceState(null, '', window.location.pathname);
            }
        }
    }, [location.search, orders]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/my-orders');
            setOrders(res.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const map = {
            pending_payment: 'bg-amber-50 text-amber-500 border-amber-100',
            pending: 'bg-amber-50 text-amber-500 border-amber-100',
            confirmed: 'bg-blue-50 text-blue-500 border-blue-100',
            paid: 'bg-emerald-50 text-emerald-500 border-emerald-100',
            shipping: 'bg-purple-50 text-purple-500 border-purple-100',
            delivered: 'bg-emerald-50 text-emerald-500 border-emerald-100',
            cancelled: 'bg-red-50 text-red-500 border-red-100'
        };
        return map[status] || 'bg-gray-50 text-gray-500';
    };

    const getStatusText = (status) => {
        const map = {
            pending_payment: 'Chờ thanh toán',
            pending: 'Đang chờ',
            confirmed: 'Xác nhận',
            paid: 'Đã thanh toán',
            shipping: 'Đang giao',
            delivered: 'Hoàn thành',
            cancelled: 'Đã hủy'
        };
        return map[status] || status;
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB] font-sans pb-20">
            <Navbar />

            {/* Modal */}
            <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />

            <main className="container mx-auto px-4 py-12 mt-44">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 px-4">
                        <div>
                            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                                Đơn <span className="text-amber-500">Hàng</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.5em] mt-4 opacity-80 border-l-4 border-amber-500 pl-4 py-1">
                                Quản lý bộ sưu tập thời trang của bạn
                            </p>
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="group flex items-center gap-4 px-10 py-5 bg-white border-2 border-gray-50 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-900 hover:border-amber-500 transition-all shadow-2xl shadow-gray-200/50 active:scale-95"
                        >
                            <span className="text-xl group-hover:rotate-180 transition-transform duration-700">🔃</span>
                            LÀM MỚI
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center space-y-8">
                            <div className="w-24 h-24 border-8 border-gray-100 border-t-amber-500 rounded-full animate-spin shadow-2xl shadow-amber-100" />
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] animate-pulse">Hệ thống đang tải dữ liệu...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="bg-white rounded-[4rem] border-2 border-gray-50 p-32 text-center shadow-2xl shadow-gray-200/50">
                            <div className="text-9xl mb-12 opacity-10">🛍️</div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-6">Bạn chưa có đơn hàng nào</h2>
                            <Link to="/" className="inline-block bg-gray-900 text-amber-500 px-16 py-6 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 hover:text-gray-900 transition-all shadow-2xl shadow-gray-200">
                                Bắt đầu mua sắm ngay
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Table Header Labels */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-12 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-60">
                                <div className="col-span-2">Mã đơn hàng</div>
                                <div className="col-span-3">Sản phẩm tiêu biểu</div>
                                <div className="col-span-2 text-center">Ngày đặt</div>
                                <div className="col-span-2 text-center">Trạng thái</div>
                                <div className="col-span-2 text-right">Tổng tiền</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Order Rows */}
                            {orders.map(order => (
                                <div
                                    key={order._id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-white rounded-[2.5rem] border border-gray-50 p-8 lg:px-12 lg:py-8 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 hover:border-amber-100 cursor-pointer transition-all duration-500 group relative overflow-hidden"
                                >
                                    <div className="lg:grid lg:grid-cols-12 lg:gap-4 items-center flex flex-col gap-6 relative z-10">
                                        {/* ID */}
                                        <div className="col-span-2 w-full lg:w-auto">
                                            <p className="lg:hidden text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Mã đơn hàng</p>
                                            <span className="font-black text-gray-900 tracking-wider text-sm">#{order._id.slice(-8).toUpperCase()}</span>
                                        </div>

                                        {/* Item Teaser */}
                                        <div className="col-span-3 w-full flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-50 flex-shrink-0 overflow-hidden shadow-inner p-1">
                                                <img
                                                    src={order.items?.[0]?.product?.images?.[0]?.url
                                                        ? (order.items[0].product.images[0].url.startsWith('http') ? order.items[0].product.images[0].url : `http://localhost:5000${order.items[0].product.images[0].url}`)
                                                        : `https://picsum.photos/seed/${order._id}/100/100`}
                                                    className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
                                                    alt="thumb"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-xs text-gray-900 uppercase truncate mb-0.5">{order.items?.[0]?.product?.name || 'Đơn hàng'}</p>
                                                <p className="text-[10px] font-bold text-gray-400 capitalize">{order.items?.length > 1 ? `và ${order.items.length - 1} sản phẩm khác` : '1 sản phẩm'}</p>
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="col-span-2 text-center w-full lg:w-auto">
                                            <p className="lg:hidden text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Ngày đặt</p>
                                            <span className="text-[11px] font-black text-gray-600 uppercase tracking-tighter italic">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2 text-center w-full lg:w-auto">
                                            <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border-2 ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </div>

                                        {/* Amount */}
                                        <div className="col-span-2 text-right w-full lg:w-auto">
                                            <p className="lg:hidden text-[9px] font-black text-gray-300 uppercase tracking-widest text-center mb-1">Tổng cộng</p>
                                            <span className="text-xl font-black text-amber-500 italic tracking-tighter tabular-nums">
                                                {(order.totalPrice || 0).toLocaleString()} đ
                                            </span>
                                        </div>

                                        {/* Arrow Button */}
                                        <div className="col-span-1 text-right w-full lg:w-auto lg:block flex justify-center mt-4 lg:mt-0">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-gray-900 text-gray-300 transition-all duration-300 text-xl font-black shadow-inner">
                                                ›
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hover background splash */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <footer className="mt-20 py-20 bg-white border-t border-gray-50 text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">PETROLIMEX FASHION • ĐẲNG CẤP VÀ PHONG CÁCH</p>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(40px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
                .animate-modalIn { animation: modalIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
            `}} />
        </div>
    );
}
