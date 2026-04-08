import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';

export default function MyVouchers() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons/available');
      setCoupons(res.data);
    } catch (err) {
      console.error("Error fetching coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-sans pb-20 overflow-x-hidden flex flex-col">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12 mt-44 w-full flex-1 animate-fadeInUp">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
          
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-50 pb-8">
              <div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Kho <span className="text-amber-500">Coupon</span></h3>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Các mã giảm giá bạn đang sở hữu và có thể dùng</p>
              </div>
              <Link to="/" className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl">
                 ĐI MUA SẮM NGAY
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {coupons.length === 0 ? (
                <div className="col-span-1 lg:col-span-2 text-center p-12 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 w-full">
                  <span className="text-5xl mb-4 block opacity-50">🎟️</span>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Kho Coupon Trống</h4>
                  <p className="text-sm text-gray-500">Hiện không có mã giảm giá nào khả dụng. Hãy thử tham gia Vòng quay may mắn nhé!</p>
                  <div className="mt-8">
                     <Link to="/lucky-wheel" className="inline-block px-8 py-4 bg-amber-500 text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20">
                        Đến Vòng Quay Ngay
                     </Link>
                  </div>
                </div>
              ) : (
                coupons.map(coupon => (
                  <div key={coupon._id} className="bg-gradient-to-r from-red-600 to-red-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-red-500/20 flex flex-col justify-between group">
                    {/* Circle cuts */}
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white z-10 shadow-[inset_-3px_0_5px_rgba(0,0,0,0.1)]"></div>
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white z-10 shadow-[inset_3px_0_5px_rgba(0,0,0,0.1)]"></div>
                    <div className="absolute left-[30px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-white/30"></div>
                    
                    <div className="pl-6 z-10 w-full relative">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase mb-2">
                            {coupon.discount > 100 ? 'GIẢM TIỀN' : 'GIẢM PHẦN TRĂM'}
                          </span>
                          <h4 className="text-3xl font-black italic tracking-tighter drop-shadow-md">
                            GIẢM {coupon.discount > 100 ? `${coupon.discount.toLocaleString('vi-VN')}đ` : `${coupon.discount}%`}
                          </h4>
                        </div>
                        <span className="text-4xl opacity-50 drop-shadow-lg flex-shrink-0">✨</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-6 bg-black/20 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <code className="text-xl font-bold tracking-widest flex-1 text-center text-yellow-300 drop-shadow-sm">{coupon.code}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            Swal.fire({
                              icon: 'success',
                              title: 'Đã sao chép',
                              text: `Mã ${coupon.code} đã được lưu vào khay nhớ tạm!`,
                              showConfirmButton: false,
                              timer: 1500
                            });
                          }}
                          className="bg-white text-red-600 p-2.5 rounded-xl hover:bg-yellow-300 transition-colors shadow-lg active:scale-90 flex-shrink-0"
                          title="Copy mã"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-[10px] uppercase tracking-widest mt-4 opacity-80 font-bold">
                        HSD: {new Date(coupon.expiryDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
