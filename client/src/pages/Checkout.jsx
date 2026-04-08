import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import Swal from 'sweetalert2';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BASE_SHIPPING_FEE = 15000;

// ─── Coupon Modal ─────────────────────────────────────────────────────────────
function CouponModal({ coupons, onSelect, onClose, selectedCoupons = [] }) {
    const [search, setSearch] = useState('');

    const filtered = coupons.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.couponType?.description || c.couponType?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    const getTypeMeta = (typeName = '') => {
        const name = typeName.toUpperCase();
        if (name.includes('PERCENT'))
            return { label: 'GIẢM THEO %', color: 'bg-amber-400 text-amber-900', icon: '%', cardBorder: 'border-amber-200', cardBg: 'bg-amber-50/40', tagBg: 'bg-amber-100', tagText: 'text-amber-700' };
        if (name.includes('FIXED') || name.includes('PRICE') || name.includes('GIA'))
            return { label: 'GIẢM THEO GIÁ', color: 'bg-blue-400 text-blue-900', icon: '₫', cardBorder: 'border-blue-200', cardBg: 'bg-blue-50/40', tagBg: 'bg-blue-100', tagText: 'text-blue-700' };
        if (name.includes('FREESHIP') || name.includes('SHIP'))
            return { label: 'FREESHIP', color: 'bg-emerald-400 text-emerald-900', icon: '🚚', cardBorder: 'border-emerald-200', cardBg: 'bg-emerald-50/40', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700' };
        return { label: typeName, color: 'bg-gray-300 text-gray-700', icon: '🎟', cardBorder: 'border-gray-200', cardBg: 'bg-gray-50/40', tagBg: 'bg-gray-100', tagText: 'text-gray-600' };
    };

    const formatDiscount = (coupon) => {
        const name = (coupon.couponType?.name || '').toUpperCase();
        if (name.includes('PERCENT')) return `Giảm ${coupon.discount}%`;
        if (name.includes('FREESHIP') || name.includes('SHIP')) return `Miễn phí vận chuyển`;
        return `Giảm ${new Intl.NumberFormat('vi-VN').format(coupon.discount)}đ`;
    };

    const formatExpiry = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-modalIn border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-10 pt-10 pb-8 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-amber-500 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-amber-200 transform -rotate-6">
                                <span className="text-2xl">🎟</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Kho <span className="text-amber-500">Coupon</span></h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">{coupons.length} ưu đãi dành cho riêng bạn</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500 font-bold hover:rotate-90 duration-300"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-focus-within:text-amber-500 transition-colors">🔍</span>
                        <input
                            type="text"
                            placeholder="Nhập mã giảm giá của bạn..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white border-2 border-gray-100 rounded-[2rem] pl-14 pr-6 py-5 text-sm font-bold text-gray-900 outline-none focus:border-amber-400 focus:shadow-xl focus:shadow-amber-100 transition-all placeholder:text-gray-300"
                        />
                    </div>
                </div>

                {/* Coupon List */}
                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-5 custom-scrollbar bg-gray-50/30">
                    {filtered.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-7xl mb-6 opacity-20 filter grayscale">🎟</div>
                            <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.4em]">Rất tiếc, chưa tìm thấy mã phù hợp</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filtered.map(coupon => {
                                const meta = getTypeMeta(coupon.couponType?.name);
                                const isSelected = selectedCoupons.some(sc => sc._id === coupon._id);
                                return (
                                    <div
                                        key={coupon._id}
                                        onClick={() => onSelect(coupon)}
                                        className={`group relative cursor-pointer rounded-[2rem] border-2 p-6 transition-all duration-300 hover:translate-y-[-4px] ${isSelected ? 'border-amber-400 bg-white shadow-2xl shadow-amber-200' : 'border-white bg-white hover:border-amber-200 shadow-sm hover:shadow-xl'}`}
                                    >
                                        <div className="flex items-center gap-6">
                                            {/* Left side with icon */}
                                            <div className={`w-20 h-20 rounded-[1.75rem] ${meta.tagBg} flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                                                <span className="text-3xl mb-1">{meta.icon}</span>
                                                <span className={`text-[8px] font-black uppercase tracking-tighter ${meta.tagText}`}>{meta.label.split(' ')[0]}</span>
                                            </div>

                                            {/* Center info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${meta.tagBg} ${meta.tagText} border border-white/50 shadow-sm`}>
                                                        {coupon.isLuckyWheel ? '🎁 Vòng Quay' : '🌏 Hệ Thống'}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-white/50 shadow-sm`}>
                                                        {coupon.couponType?.description || coupon.couponType?.name}
                                                    </span>
                                                </div>
                                                <h4 className="font-black text-gray-900 tracking-wider text-lg uppercase mb-1">{coupon.code}</h4>
                                                <p className={`font-black text-xl italic tracking-tighter ${meta.tagText}`}>
                                                    {formatDiscount(coupon)}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                                                    <div className="flex items-center gap-1.5 font-bold text-[9px] text-gray-400 uppercase tracking-widest leading-none">
                                                        <span className="text-xs">📅</span> HSD: {formatExpiry(coupon.expiryDate)}
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                                                    <div className="flex items-center gap-1.5 font-bold text-[9px] text-gray-400 uppercase tracking-widest leading-none">
                                                        <span className="text-xs">🎟</span> Còn {coupon.quantity} lượt
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action / Selection */}
                                            <div className="flex-shrink-0">
                                                <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-amber-500 border-amber-100 scale-110 shadow-lg shadow-amber-200' : 'bg-gray-50 border-gray-100 group-hover:bg-amber-50'}`}>
                                                    {isSelected && <span className="text-white text-sm font-black animate-bounce mt-1">✓</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background decorative element */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-30 group-hover:bg-amber-50 transition-colors" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                    {selectedCoupons.length > 0 ? (
                        <button
                            onClick={() => onSelect([])}
                            className="flex-1 py-5 rounded-[1.5rem] border-2 border-dashed border-red-100 text-[11px] font-black text-red-400 uppercase tracking-widest hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-3"
                        >
                            <span>🗑</span> Gỡ mã giảm giá
                        </button>
                    ) : null}
                    <button
                        onClick={onClose}
                        className={`flex-[2] bg-gray-900 text-white font-black uppercase tracking-[0.3em] py-5 rounded-[1.5rem] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-2xl flex items-center justify-center gap-3 text-xs ${selectedCoupons.length === 0 ? 'w-full' : ''}`}
                    >
                        <span>{selectedCoupons.length > 0 ? 'Xác Nhận Áp Dụng' : 'Trở Lại'}</span>
                        <span className="text-lg">✨</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Address Book Modal ──────────────────────────────────────────────────────
function AddressBookModal({ addresses, onSelect, onClose }) {
    if (!addresses || addresses.length === 0) {
        return (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
                <div onClick={e => e.stopPropagation()} className="relative bg-white rounded-[3rem] p-10 shadow-2xl w-full max-w-md text-center border border-white/20">
                    <div className="text-6xl mb-6 opacity-50">📭</div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic mb-2">Sổ Địa Chỉ <span className="text-amber-500">Trống</span></h3>
                    <p className="text-sm font-bold text-gray-500 mb-8">Bạn chưa lưu địa chỉ nào trong hồ sơ cá nhân.</p>
                    <button onClick={onClose} className="w-full bg-gray-900 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl">Đóng</button>
                </div>
            </div>
        );
    }
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <div onClick={e => e.stopPropagation()} className="relative bg-white rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-modalIn border border-white/20">
                <div className="px-10 pt-10 pb-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Sổ <span className="text-amber-500">Địa Chỉ</span></h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Chọn địa chỉ giao hàng của bạn</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500 font-bold hover:rotate-90 duration-300">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 custom-scrollbar bg-gray-50/30">
                    {addresses.map(addr => (
                        <div key={addr._id} onClick={() => onSelect(addr)} className="group cursor-pointer bg-white rounded-[2rem] border-2 border-gray-100 p-6 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex-1 pr-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <h5 className="font-black text-gray-900 uppercase tracking-widest text-sm">{addr.receiverName}</h5>
                                    {addr.isDefault && <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-200 shadow-sm">Mặc định</span>}
                                </div>
                                <p className="text-gray-500 text-xs font-bold mb-1">📞 {addr.phone}</p>
                                <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">{addr.street}, {addr.ward}, {addr.district}, {addr.city}</p>
                            </div>
                            <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-amber-500 flex items-center justify-center transition-colors shadow-inner group-hover:shadow-amber-200">
                                <span className="text-xl text-gray-300 group-hover:text-amber-900 transition-colors">👉</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Checkout Component ─────────────────────────────────────────────────
export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart, clearCart, user } = useCart();
    const [loading, setLoading] = useState(false);

    const isBuyNow = !!location.state?.buyNowItem;
    const checkoutItems = isBuyNow ? [location.state.buyNowItem] : cart;

    // Coupon State
    const [coupons, setCoupons] = useState([]);
    const [selectedCoupons, setSelectedCoupons] = useState([]);
    const [showCouponModal, setShowCouponModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'COD'
    });

    // ── Map & Shipping state ──────────────────────────────────────────────────
    const [mapCoords, setMapCoords] = useState(null);       // { lat, lng }
    const [shippingFee, setShippingFee] = useState(BASE_SHIPPING_FEE);
    const [shippingDistance, setShippingDistance] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [calcLoading, setCalcLoading] = useState(false);
    const [showAddressBook, setShowAddressBook] = useState(false);

    // Map click handler component
    function LocationPicker({ onPick }) {
        useMapEvents({
            click(e) { onPick(e.latlng); }
        });
        return null;
    }

    // Hiển thị thông báo kết quả VNPay nếu redirect về
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const vnpay = params.get('vnpay');
        if (vnpay === 'success') {
            Swal.fire({
                icon: 'success',
                title: 'Thanh toán VNPay thành công! 🎉',
                text: 'Đơn hàng của bạn đã được xác nhận và đang được xử lý.',
                confirmButtonColor: '#111827',
                confirmButtonText: 'Xem đơn hàng'
            });
        } else if (vnpay === 'fail') {
            Swal.fire({
                icon: 'error',
                title: 'Thanh toán VNPay thất bại',
                text: 'Giao dịch không thành công. Vui lòng thử lại.',
                confirmButtonColor: '#111827'
            });
        }
    }, []);

    // Auto-fill from profile
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || ''
            }));
        }
    }, [user]);

    const shopIdsStr = Array.from(new Set(checkoutItems.map(i => i.product?.shop?._id || i.product?.shop).filter(id => !!id))).join(',');

    // Fetch available coupons
    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const res = await api.get(`/coupons/available${shopIdsStr ? `?shopIds=${shopIdsStr}` : ''}`);
                setCoupons(res.data);
            } catch (err) {
                console.error("Error fetching coupons:", err);
            }
        };
        fetchCoupons();
    }, [shopIdsStr]);

    const formatPrice = (price) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

    const getItemPrice = (item) => {
        if (!item.product) return 0;
        let price = item.product.price;
        if (item.product.isFlashSale && item.product.flashSaleEndDate && new Date(item.product.flashSaleEndDate) > new Date() && item.product.flashSaleStock > 0) {
            price = item.product.flashSalePrice || price;
        }
        return price;
    };

    const getCheckoutTotal = useCallback(() => {
        return checkoutItems.reduce((total, item) => total + getItemPrice(item) * item.quantity, 0);
    }, [checkoutItems]);

    // ── Discount logic ──────────────────────────────────────────────────────
    // Helper: nhận diện loại coupon hỗ trợ cả EN (PERCENT_DISCOUNT) và VI (GIẢM THEO %)
    const detectCouponKind = useCallback((coupon) => {
        const name = (coupon?.couponType?.name || '').toUpperCase();
        if (name.includes('FREESHIP') || name.includes('SHIP') || name.includes('VẬN CHUYỂN'))
            return 'freeship';
        if (name.includes('PERCENT') || name.includes('%'))
            return 'percent';
        return 'fixed';
    }, []);

    const isFreeship = useCallback((coupon) =>
        detectCouponKind(coupon) === 'freeship'
        , [detectCouponKind]);

    const isPercent = useCallback((coupon) =>
        detectCouponKind(coupon) === 'percent'
        , [detectCouponKind]);

    const getTierDiscountRates = useCallback(() => {
        const tier = user?.customerTier || "thường";
        let shippingDiscountRate = 0;
        let orderDiscountRate = 0;
        
        switch (tier) {
            case "đồng": shippingDiscountRate = 0.05; break;
            case "bạc": shippingDiscountRate = 0.10; break;
            case "vàng": shippingDiscountRate = 0.10; orderDiscountRate = 0.05; break;
            case "bạch kim": shippingDiscountRate = 0.15; orderDiscountRate = 0.10; break;
            case "kim cương": shippingDiscountRate = 0.20; orderDiscountRate = 0.20; break;
        }
        return { shippingDiscountRate, orderDiscountRate };
    }, [user?.customerTier]);

    const getOrderDiscount = useCallback(() => {
        const subtotal = getCheckoutTotal();
        let totalDiscount = 0;
        
        if (selectedCoupons && selectedCoupons.length > 0) {
            selectedCoupons.forEach(coupon => {
                if (isFreeship(coupon)) return;
                const value = coupon.discount || 0;
                if (isPercent(coupon)) {
                     totalDiscount += (subtotal * value) / 100;
                } else {
                     totalDiscount += value;
                }
            });
        }
        
        const { orderDiscountRate } = getTierDiscountRates();
        if (orderDiscountRate > 0) {
             totalDiscount += (subtotal * orderDiscountRate);
        }
        
        return Math.floor(totalDiscount);
    }, [selectedCoupons, getCheckoutTotal, isFreeship, isPercent, getTierDiscountRates]);

    const getShippingAfterDiscount = useCallback(() => {
        const hasFreeship = selectedCoupons.some(c => isFreeship(c));
        if (hasFreeship) return 0;
        
        const { shippingDiscountRate } = getTierDiscountRates();
        const result = shippingFee - (shippingFee * shippingDiscountRate);
        return Math.floor(result > 0 ? result : 0);
    }, [isFreeship, selectedCoupons, shippingFee, getTierDiscountRates]);

    // Calculate shipping from server when coords change
    const handleMapPick = useCallback(async (latlng) => {
        setMapCoords(latlng);
        setCalcLoading(true);

        const firstProduct = checkoutItems?.[0]?.product;
        // In case product.shop is just an id string or an object with _id
        const shopId = firstProduct?.shop?._id || firstProduct?.shop;

        try {
            const res = await api.post('/shipping/calculate', {
                lat: latlng.lat,
                lng: latlng.lng,
                shopId
            });
            setShippingFee(res.data.shippingFee);
            setShippingDistance(res.data.distance);
            // Use address returned by server if available
            if (res.data.address) {
                setFormData(prev => ({ ...prev, address: res.data.address }));
            }
        } catch (err) {
            console.error('Shipping calc error:', err);
        } finally {
            setCalcLoading(false);
        }
    }, [checkoutItems]);

    const handleSelectSavedAddress = useCallback((addr) => {
        setFormData(prev => ({
            ...prev,
            name: addr.receiverName,
            phone: addr.phone,
            address: `${addr.street}, ${addr.ward}, ${addr.district}, ${addr.city}`
        }));
        setShowAddressBook(false);
        if (addr.lat && addr.lng) {
            setShowMap(true);
            handleMapPick({ lat: addr.lat, lng: addr.lng });
        }
    }, [handleMapPick]);

    const getFinalTotal = useCallback(() => {
        const subtotal = getCheckoutTotal();
        const orderDiscount = getOrderDiscount();
        const shipping = getShippingAfterDiscount();
        const total = subtotal - orderDiscount + shipping;
        return total > 0 ? total : 0;
    }, [getCheckoutTotal, getOrderDiscount, getShippingAfterDiscount]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectCoupon = (coupon) => {
        if (!coupon) {
            setSelectedCoupons([]);
            return;
        }

        const isAlreadySelected = selectedCoupons.some(sc => sc._id === coupon._id);
        if (isAlreadySelected) {
            setSelectedCoupons(prev => prev.filter(sc => sc._id !== coupon._id));
            return;
        }

        const kind = detectCouponKind(coupon);
        
        // Kiểm tra xem việc thêm coupon mới có gây ra xung đột loại không (% vs Giá tiền)
        const hasPercent = selectedCoupons.some(c => detectCouponKind(c) === 'percent');
        const hasFixed = selectedCoupons.some(c => detectCouponKind(c) === 'fixed');

        if ((kind === 'percent' && hasFixed) || (kind === 'fixed' && hasPercent)) {
            Swal.fire({
                icon: 'warning',
                title: 'Không thể kết hợp!',
                text: 'Hệ thống không cho phép áp dụng đồng thời mã giảm giá theo % và mã giảm giá theo giá tiền cố định.',
                confirmButtonColor: '#111827'
            });
            return;
        }

        // Nếu đã chọn 2 mã, tiến hành thay thế mã cùng loại hoặc mã cũ nhất
        if (selectedCoupons.length >= 2) {
             const sameKindIdx = selectedCoupons.findIndex(c => detectCouponKind(c) === kind);
             if (sameKindIdx > -1) {
                 const newSelected = [...selectedCoupons];
                 newSelected[sameKindIdx] = coupon;
                 setSelectedCoupons(newSelected);
             } else {
                 // Nếu khác loại (ví dụ chọn mã thứ 3), thay thế mã đầu tiên
                 setSelectedCoupons(prev => [prev[1], coupon]);
             }
             return;
        }

        // Nếu chưa đủ 2 mã, cho phép thêm thoải mái (vì đã qua check xung đột loại ở trên)
        setSelectedCoupons(prev => [...prev, coupon]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (checkoutItems.length === 0) return;

        setLoading(true);
        try {
            const voucherIds = selectedCoupons.map(c => c._id);
            const hasFreeship = selectedCoupons.some(c => isFreeship(c));
            const discountAmount = getOrderDiscount() + (hasFreeship ? shippingFee : 0);

            // ── Thanh toán VNPay ──────────────────────────────────────────
            if (formData.paymentMethod === 'VNPAY') {
                const response = await api.post('/orders/vnpay/create_payment_url', {
                    items: checkoutItems,
                    totalPrice: getFinalTotal(),
                    discountAmount,
                    shippingFee: getShippingAfterDiscount(),
                    vouchers: voucherIds,
                    address: formData.address,
                    phone: formData.phone,
                    isBuyNow,
                    language: 'vn'
                });
                // Redirect đến trang thanh toán VNPay
                window.location.href = response.data.paymentUrl;
                return; // Dừng - browser sẽ redirect
            }

            // ── Thanh toán COD ────────────────────────────────────────────
            await api.post('/orders', {
                items: checkoutItems,
                totalPrice: getFinalTotal(),
                discountAmount,
                shippingFee: getShippingAfterDiscount(),
                vouchers: voucherIds,
                address: formData.address,
                phone: formData.phone,
                paymentMethod: formData.paymentMethod,
                isBuyNow
            });

            await Swal.fire({
                icon: 'success',
                title: 'Đặt hàng thành công!',
                text: 'Cảm ơn bạn đã mua sắm tại Petrolimex Fashion.',
                confirmButtonColor: '#111827',
                confirmButtonText: 'Xem đơn hàng của tôi'
            });

            if (!isBuyNow) {
                clearCart();
            }
            navigate('/order-history');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi đặt hàng',
                text: error.response?.data?.message || 'Vui lòng thử lại sau.'
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Coupon display meta ──────────────────────────────────────────────────
    const getTypeMeta = (coupon) => {
        const kind = detectCouponKind(coupon);
        if (kind === 'percent') return { label: 'GIẢM THEO %', tagBg: 'bg-amber-100', tagText: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50' };
        if (kind === 'freeship') return { label: 'FREESHIP', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50' };
        return { label: 'GIẢM THEO GIÁ', tagBg: 'bg-blue-100', tagText: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50' };
    };

    const formatCouponValue = (coupon) => {
        if (!coupon) return '';
        const kind = detectCouponKind(coupon);
        if (kind === 'percent') return `Giảm ${coupon.discount}% đơn hàng`;
        if (kind === 'freeship') return `Miễn phí vận chuyển`;
        return `Giảm ${new Intl.NumberFormat('vi-VN').format(coupon.discount)}đ`;
    };

    if (checkoutItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center font-sans px-4">
                <Navbar />
                <div className="bg-white p-20 rounded-[3rem] shadow-2xl shadow-gray-200/50 text-center max-w-2xl w-full border border-gray-100 italic">
                    <div className="text-8xl mb-10 opacity-20">📦</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tighter">Giỏ hàng trống!</h2>
                    <Link to="/" className="inline-block bg-gray-900 text-amber-500 font-black tracking-widest uppercase px-12 py-5 rounded-3xl hover:bg-amber-500 hover:text-gray-900 transition-all">
                        Quay lại mua sắm
                    </Link>
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-[#FBFBFB] flex flex-col font-sans">
            <Navbar />

            {/* Coupon Modal */}
            {showCouponModal && (
                <CouponModal
                    coupons={coupons}
                    selectedCoupons={selectedCoupons}
                    onSelect={handleSelectCoupon}
                    onClose={() => setShowCouponModal(false)}
                />
            )}

            {/* Address Book Modal */}
            {showAddressBook && (
                <AddressBookModal
                    addresses={user?.addresses || []}
                    onSelect={handleSelectSavedAddress}
                    onClose={() => setShowAddressBook(false)}
                />
            )}

            <main className="flex-1 container mx-auto px-4 py-8 mt-44">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* LEFT: Checkout Form */}
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <Link to="/cart" className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </Link>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Thanh <span className="text-amber-500">Toán</span></h1>
                        </div>

                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-10 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />

                                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-50 pb-8 mb-10 gap-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Thông Tin <span className="text-amber-500">Giao Hàng</span></h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Vui lòng cung cấp chính xác để nhận hàng nhanh nhất</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressBook(true)}
                                        className="group relative flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] bg-gray-900 text-amber-400 hover:bg-amber-500 hover:text-gray-900 transition-all duration-500 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-gray-200 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                        <span className="relative z-10 text-lg">📋</span>
                                        <span className="relative z-10 tracking-widest">Chọn từ sổ địa chỉ</span>
                                    </button>
                                </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Họ và Tên</label>
                                        <input
                                            type="text" name="name" required value={formData.name} onChange={handleChange}
                                            placeholder="Nhập tên người nhận..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-6 py-4 outline-none focus:border-amber-500/50 focus:bg-white transition-all font-bold text-gray-900 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Số Điện Thoại</label>
                                        <input
                                            type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                                            placeholder="Nhập số điện thoại..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-6 py-4 outline-none focus:border-amber-500/50 focus:bg-white transition-all font-bold text-gray-900 shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Địa Chỉ Nhận Hàng</label>
                                    <textarea
                                        name="address" required rows="3" value={formData.address} onChange={handleChange}
                                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] px-6 py-4 outline-none focus:border-amber-500/50 focus:bg-white transition-all font-bold text-gray-900 shadow-inner resize-none"
                                    />
                                    {/* Map toggle button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowMap(v => !v)}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-600 ml-4 mt-1 transition-colors"
                                    >
                                        <span className="text-base">📍</span>
                                        {showMap ? 'Ẩn bản đồ' : 'Chọn vị trí trên bản đồ (tính phí ship chính xác)'}
                                    </button>

                                    {/* Leaflet Map */}
                                    {showMap && (
                                        <div className="rounded-[2rem] overflow-hidden border-2 border-amber-200 shadow-xl mt-3" style={{ height: 300 }}>
                                            <MapContainer
                                                center={mapCoords || [10.7769, 106.7009]}
                                                zoom={13}
                                                style={{ width: '100%', height: '100%' }}
                                            >
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                                                />
                                                <LocationPicker onPick={handleMapPick} />
                                                {mapCoords && <Marker position={mapCoords} />}
                                            </MapContainer>
                                        </div>
                                    )}

                                    {/* Shipping info bubble */}
                                    {shippingDistance && (
                                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-[1.5rem] px-5 py-3 mt-2">
                                            {calcLoading ? <span className="text-[10px] font-black text-amber-600 animate-pulse">Đang tính...</span> : (
                                                <>
                                                    <span className="text-lg">🚚</span>
                                                    <div>
                                                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Khoảng cách: {shippingDistance} km</p>
                                                        <p className="text-[10px] font-black text-amber-600">Phí vận chuyển: {formatPrice(shippingFee)}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-widest">Phương Thức Thanh Toán</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${formData.paymentMethod === 'COD' ? 'border-amber-500 bg-amber-50/50 shadow-lg' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}>
                                            <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} className="w-5 h-5 accent-amber-500" />
                                            <div className="flex-1">
                                                <p className="font-black text-xs uppercase tracking-widest text-gray-900">COD (Tiền mặt)</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Thanh toán khi nhận hàng</p>
                                            </div>
                                            <span className="text-2xl">💵</span>
                                        </label>

                                        <label className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${formData.paymentMethod === 'VNPAY' ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' : 'border-gray-50 bg-gray-50 hover:border-blue-200'}`}>
                                            <input type="radio" name="paymentMethod" value="VNPAY" checked={formData.paymentMethod === 'VNPAY'} onChange={handleChange} className="w-5 h-5 accent-blue-500" />
                                            <div className="flex-1">
                                                <p className="font-black text-xs uppercase tracking-widest text-gray-900">Chuyển khoản VNPay</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Thanh toán qua cổng VNPay 🔒</p>
                                            </div>
                                            <span className="text-2xl">💳</span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className={`w-full font-black uppercase tracking-[0.3em] py-7 rounded-[2rem] transition-all shadow-2xl active:scale-95 disabled:opacity-50 mt-4 text-xs ${formData.paymentMethod === 'VNPAY'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                                        : 'bg-gray-900 text-white hover:bg-amber-500 hover:text-gray-900 shadow-gray-200'
                                        }`}
                                >
                                    {loading
                                        ? 'ĐANG XỬ LÝ...'
                                        : formData.paymentMethod === 'VNPAY'
                                            ? '🔒 THANH TOÁN QUA VNPAY'
                                            : 'XÁC NHẬN ĐẶT HÀNG'
                                    }
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT: Order Summary */}
                    <div className="w-full lg:w-[450px]">
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-10 lg:sticky lg:top-32 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                            <h3 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tighter italic border-b border-gray-50 pb-6 flex items-center justify-between">
                                Tóm Tắt <span className="text-amber-500">Đơn Hàng</span>
                            </h3>

                            {/* Cart Items */}
                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-5 mb-6">
                                {checkoutItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center group">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 shadow-sm">
                                            <img
                                                src={item.product?.images?.[0]?.url
                                                    ? (item.product.images[0].url.startsWith('http') ? item.product.images[0].url : `http://localhost:5000${item.product.images[0].url}`)
                                                    : `https://picsum.photos/seed/${item.product?._id}/100/100`}
                                                alt={item.product?.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-xs text-gray-900 uppercase truncate tracking-tight">{item.product?.name}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.color} | {item.size}</span>
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">x{item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm text-gray-900 tracking-tighter">{formatPrice(getItemPrice(item) * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── COUPON SECTION ───────────────────────────────── */}
                            <div className="border-t border-dashed border-gray-100 pt-6 mt-2">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-1.5">
                                        <span>🎟</span> Coupon Ưu Đãi
                                    </span>
                                    {coupons.length > 0 && (
                                        <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                            {coupons.length} mã
                                        </span>
                                    )}
                                </div>

                                {/* Selected coupon display or button */}
                                {/* Selected voucher display or button */}
                                {selectedCoupons.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedCoupons.map(coupon => {
                                            const meta = getTypeMeta(coupon);
                                            return (
                                                <div key={coupon._id} className="group relative overflow-hidden">
                                                    <div className={`rounded-[2rem] border-2 p-6 ${meta?.border} ${meta?.bg} shadow-lg shadow-amber-100 hover:shadow-2xl transition-all duration-500`}>
                                                        <div className="flex items-center gap-4 relative z-10">
                                                            <div className={`w-14 h-14 rounded-2xl ${meta?.tagBg} flex items-center justify-center text-2xl flex-shrink-0 shadow-inner`}>
                                                                {isFreeship(coupon) ? '🚚' : '✨'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${meta?.tagBg} ${meta?.tagText}`}>
                                                                        {meta?.label}
                                                                    </span>
                                                                </div>
                                                                <p className="font-black text-gray-900 text-base uppercase tracking-wider">{coupon.code}</p>
                                                                <p className={`text-[11px] font-black mt-0.5 ${meta?.tagText}`}>{formatCouponValue(coupon)}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setSelectedCoupons(prev => prev.filter(c => c._id !== coupon._id))}
                                                                className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all font-bold"
                                                                title="Gỡ coupon"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* Action to change/add */}
                                        <button
                                            onClick={() => setShowCouponModal(true)}
                                            className="w-full py-4 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>➕</span> {selectedCoupons.length === 1 && !selectedCoupons.some(c => isFreeship(c)) ? 'Thêm Freeship' : (selectedCoupons.length === 1 ? 'Thêm mã giảm giá' : 'Thay đổi Voucher')}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowCouponModal(true)}
                                        disabled={coupons.length === 0}
                                        className={`w-full group flex items-center justify-between p-1 rounded-[2.2rem] border-2 transition-all duration-500 bg-white ${coupons.length > 0 ? 'border-amber-100 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-100 cursor-pointer' : 'border-gray-50 opacity-50 cursor-not-allowed'}`}
                                    >
                                        <div className="flex items-center gap-4 py-3 px-6 mr-auto">
                                            <div className="w-12 h-12 bg-amber-500 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-amber-200 group-hover:rotate-12 transition-transform duration-500">
                                                <span className="text-xl">🎟</span>
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">Chọn Voucher</span>
                                                <span className="block text-[9px] font-bold text-gray-400 uppercase mt-0.5">{coupons.length > 0 ? `Có ${coupons.length} ưu đãi khả dụng` : 'Rất tiếc, chưa có ưu đãi'}</span>
                                            </div>
                                        </div>
                                        {coupons.length > 0 && (
                                            <div className="w-14 h-14 rounded-[2rem] bg-gray-900 group-hover:bg-amber-500 flex items-center justify-center transition-colors duration-500 mr-1">
                                                <span className="text-white group-hover:text-gray-900 font-black text-xl translate-x-1 group-hover:translate-x-2 transition-transform">›</span>
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* ── Price Highlight Boxes ────────────────────── */}
                            <div className="mt-8 space-y-3">
                                {/* Row 1: Original price */}
                                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-sm shadow-inner">🏷</div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tổng tiền gốc</span>
                                    </div>
                                    <span className={`font-black tracking-tight tabular-nums ${selectedCoupons.length > 0 ? 'line-through text-gray-300 text-sm' : 'text-gray-900 text-base'}`}>
                                        {formatPrice(getCheckoutTotal())}
                                    </span>
                                </div>

                                {/* Row 2: After voucher price */}
                                <div className={`flex items-center justify-between px-6 py-4 rounded-[1.5rem] border-2 transition-all duration-500 ${selectedCoupons.length > 0 ? 'bg-amber-50 border-amber-200 shadow-lg shadow-amber-100' : 'bg-gray-50/30 border-dashed border-gray-100 opacity-60'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-inner border ${selectedCoupons.length > 0 ? 'bg-amber-500 border-amber-400 text-white' : 'bg-white border-gray-200'}`}>✨</div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCoupons.length > 0 ? 'text-amber-700' : 'text-gray-400'}`}>Sau khi áp Voucher</span>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black tracking-tight tabular-nums text-lg ${selectedCoupons.length > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                                            {selectedCoupons.length > 0 ? formatPrice(getCheckoutTotal() - getOrderDiscount()) : '---'}
                                        </p>
                                        {selectedCoupons.length > 0 && getOrderDiscount() > 0 && (
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">
                                                Tiết kiệm {formatPrice(getOrderDiscount())} 🎉
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Price Summary ──────────────────────────────── */}
                            <div className="space-y-3 pt-6 border-t border-dashed border-gray-200 mt-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tạm tính</span>
                                    <span className="font-bold text-gray-900 tracking-tight">{formatPrice(getCheckoutTotal())}</span>
                                </div>

                                {getOrderDiscount() > 0 && (
                                    <div className="flex justify-between items-center text-amber-500 animate-fadeInUp">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Giảm giá Voucher</span>
                                        <span className="font-bold tracking-tight">-{formatPrice(getOrderDiscount())}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Phí vận chuyển</span>
                                    {selectedCoupons.some(c => isFreeship(c)) ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] line-through text-gray-300 font-bold">{formatPrice(shippingFee)}</span>
                                            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Miễn Phí 🚚</span>
                                        </div>
                                    ) : (
                                        <span className="font-bold text-gray-700 tracking-tight">{formatPrice(shippingFee)}</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center py-5 border-t border-gray-900 mt-2">
                                    <span className="font-black text-gray-900 uppercase tracking-tighter text-lg italic italic">Thanh toán</span>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-amber-500 tracking-tighter italic">{formatPrice(getFinalTotal())}</div>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">Bao gồm phí vận chuyển & VAT</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-gray-900 rounded-[2rem] p-6 text-center shadow-xl shadow-gray-200 group hover:bg-amber-500 transition-colors duration-500">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2 group-hover:text-gray-900">Cam Kết Petrolimex</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed group-hover:text-gray-800">Sản phẩm chính hãng 100% - Đổi trả trong 7 ngày - Hỗ trợ tận tâm 24/7</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-gray-100 py-10 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mt-20">
                <p>© 2026 Petrolimex Fashion. Quyền được mặc đẹp.</p>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
                .animate-modalIn { animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}} />
        </div >
    );
}
