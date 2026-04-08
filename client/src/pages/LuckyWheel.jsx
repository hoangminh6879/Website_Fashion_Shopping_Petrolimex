import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import confetti from 'canvas-confetti';

const LuckyWheel = () => {
  const [prizes, setPrizes] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  const { user } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    try {
      const res = await api.get('/lucky-wheel');
      setPrizes(res.data.filter(p => p.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSpin = async () => {
    if (!user) {
      Swal.fire({
        title: 'Yêu cầu đăng nhập',
        text: 'Bạn cần đăng nhập để tham gia vòng quay!',
        icon: 'warning',
        confirmButtonText: 'Đăng nhập ngay'
      }).then(() => navigate('/login'));
      return;
    }

    if (prizes.length === 0) return Swal.fire('Thông báo', 'Vòng quay hiện chưa sẵn sàng', 'info');
    if (spinning) return;

    setSpinning(true);

    try {
      const res = await api.post('/lucky-wheel/spin');
      const wonPrize = res.data.prize;
      
      const prizeIndex = prizes.findIndex(p => p._id === wonPrize._id);
      
      if (prizeIndex === -1) {
          setSpinning(false);
          return Swal.fire('Lỗi', 'Không tìm thấy thông tin giải', 'error');
      }

      const sliceAngle = 360 / prizes.length;
      const targetAngle = 360 - (prizeIndex * sliceAngle + sliceAngle / 2);
      
      // Xoay thêm 7 vòng
      const extraLoops = 7 * 360;
      // Dựa trên local rotation state
      const currentMod = rotation % 360;
      // Tính offset reset
      const resetOffset = rotation - currentMod;
      const finalRotation = resetOffset + extraLoops + targetAngle;

      setRotation(finalRotation);

      setTimeout(() => {
        setSpinning(false);
        if (wonPrize.type === 'coupon') {
           const code = wonPrize.couponId?.code || 'ERROR';
           
           // Hiệu ứng pháo hoa bắn 2 bên hoành tráng
           const duration = 3000;
           const end = Date.now() + duration;

           (function frame() {
              confetti({
                particleCount: 8,
                angle: 60,
                spread: 60,
                origin: { x: 0, y: 0.8 },
                colors: ['#f59e0b', '#fbbf24', '#ffffff', '#dc2626'],
                zIndex: 10000
              });
              confetti({
                particleCount: 8,
                angle: 120,
                spread: 60,
                origin: { x: 1, y: 0.8 },
                colors: ['#f59e0b', '#fbbf24', '#ffffff', '#dc2626'],
                zIndex: 10000
              });

              if (Date.now() < end) {
                requestAnimationFrame(frame);
              }
           }());

           // Nổ chùm lớn ở giữa
           confetti({
             particleCount: 200,
             spread: 120,
             origin: { y: 0.5 },
             colors: ['#f59e0b', '#dc2626', '#ffffff'],
             zIndex: 10000
           });

           // Swal đẹp hơn
           Swal.fire({
             title: '🎉 BẠN ĐÃ TRÚNG THƯỞNG! 🎉',
             html: `Cảm ơn bạn đã tham gia vòng quay may mắn!<br/><br/>Phần thưởng của bạn là: <br/><b style="color: #ea580c; font-size: 20px;">${wonPrize.name}</b><br/><br/>Mã voucher của bạn:<br/><br/><b style="font-size: 32px; color: #dc2626; background: #fee2e2; padding: 10px 20px; border-radius: 12px; border: 2px dashed #fca5a5; display: inline-block; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2); letter-spacing: 2px;">${code}</b>`,
             icon: 'success',
             iconHtml: '💎',
             customClass: {
               icon: 'border-0 bg-transparent text-5xl',
               popup: 'rounded-3xl border-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.5)]',
               title: 'text-gray-900 font-black text-2xl uppercase tracking-wider',
             },
             background: '#fff url("https://www.transparenttextures.com/patterns/cubes.png")',
             width: 500,
             padding: '2em',
             confirmButtonColor: '#ea580c',
             confirmButtonText: '<b style="font-size: 16px; padding: 0 10px;">SAO CHÉP MÃ & NHẬN THƯỞNG</b>',
             backdrop: `
               rgba(0,0,123,0.4)
             `
           }).then((result) => {
             if (result.isConfirmed) {
               navigator.clipboard.writeText(code);
               Swal.fire('Đã lưu!', 'Mã giảm giá đã được sao chép.', 'success');
             }
           });
        } else {
           Swal.fire({
             title: 'Opps!',
             text: wonPrize.name || 'Chúc bạn may mắn lần sau nhé!',
             imageUrl: 'https://cdn-icons-png.flaticon.com/512/742/742751.png',
             imageWidth: 100,
             imageHeight: 100,
             confirmButtonColor: '#3b82f6',
             confirmButtonText: 'Đóng'
           });
        }
      }, 5000);

    } catch (err) {
      setSpinning(false);
      Swal.fire('Opps!', err.response?.data?.message || 'Có lỗi xảy ra, thử lại sau.', 'error');
    }
  };

  const getGradient = () => {
    if (prizes.length === 0) return '#fafafa';
    const sliceAngle = 360 / prizes.length;
    let gradientParts = [];
    prizes.forEach((p, index) => {
      const start = index * sliceAngle;
      const end = start + sliceAngle;
      gradientParts.push(`${p.color || '#fff'} ${start}deg ${end}deg`);
    });
    return `conic-gradient(${gradientParts.join(', ')})`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-black">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.05); }
        }
        @keyframes bulbBlink {
          0%, 100% { opacity: 0.3; box-shadow: none; background-color: #d946ef; }
          50% { opacity: 1; box-shadow: 0 0 10px #fef08a, 0 0 20px #fde047; background-color: #fff; }
        }
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
          70% { box-shadow: 0 0 0 30px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>
      <Navbar />
      <div className="flex-1 bg-gradient-to-br from-gray-900 to-black flex flex-col pt-10 pb-20 items-center justify-center relative overflow-hidden">
        {/* Pattern chìm */}
        <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fbbf24 2px, transparent 2px)', backgroundSize: '40px 40px', animation: 'starTwinkle 6s ease-in-out infinite' }}></div>
        
        <div className="z-10 text-center mb-12 px-4 mt-8">
           <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600 drop-shadow-2xl mb-4" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.8))' }}>VÒNG QUAY MAY MẮN</h1>
           <p className="text-white text-lg md:text-2xl font-bold bg-white/5 inline-block px-6 py-2 rounded-full backdrop-blur-sm border border-amber-500/20">Thử vận may mỗi ngày - Nhận ngay voucher khủng!</p>
        </div>

        <div className="relative z-10 w-[320px] h-[320px] md:w-[480px] md:h-[480px] mb-8 group" style={{ animation: 'float 5s ease-in-out infinite' }}>
          {/* Mũi tên */}
          <div className="absolute -top-6 md:-top-10 left-1/2 -translate-x-1/2 z-20">
             <svg width="60" height="60" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 8px 4px rgba(0,0,0,0.8))' }}>
                <path d="M12 24L2 0L22 0L12 24Z"/>
             </svg>
          </div>

          <div className="absolute inset-0 rounded-full border-[10px] md:border-[16px] border-amber-600 shadow-[0_0_50px_rgba(245,158,11,0.4)] bg-amber-600 pointer-events-none z-0"></div>

          {/* Đèn vòm chạy quanh kim */}
          {[...Array(16)].map((_, i) => (
             <div
               key={`bulb-${i}`}
               className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none z-20"
               style={{ transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)` }}
             >
               <div 
                 className="absolute top-[2px] md:top-[4px] left-1/2 w-2 h-2 md:w-3 md:h-3 rounded-full bg-white transition-all duration-300"
                 style={{ 
                   transform: 'translateX(-50%)',
                   animation: `bulbBlink 1.2s infinite ${i % 2 === 0 ? '0s' : '0.6s'}`,
                 }}
               ></div>
             </div>
          ))}

          {/* Disc */}
          <div 
            className="w-full h-full rounded-full border-[12px] md:border-[16px] border-amber-400 relative overflow-hidden z-10 shadow-inner"
            style={{
               background: getGradient(),
               transform: `rotate(${rotation}deg)`,
               transition: 'transform 5.2s cubic-bezier(0.15, 0.9, 0.1, 1)' // mượt ở đuôi
            }}
          >
            {/* Kẻ đường viền chia các ô */}
            {prizes.length > 0 && prizes.map((_, idx) => {
               const sliceAngle = 360 / prizes.length;
               const lineRotate = idx * sliceAngle;
               return (
                 <div 
                   key={`line-${idx}`}
                   className="absolute top-0 left-1/2 w-0.5 md:w-1 h-1/2 bg-gray-900/40 origin-bottom z-0"
                   style={{ 
                     transform: `translateX(-50%) rotate(${lineRotate}deg)` 
                   }}
                 />
               );
            })}

            {prizes.length > 0 && prizes.map((prize, idx) => {
               const sliceAngle = 360 / prizes.length;
               const textRotate = idx * sliceAngle + sliceAngle / 2;
               return (
                 <div 
                   key={prize._id} 
                   className="absolute inset-0 flex justify-center items-start pt-6 md:pt-10 font-black text-white text-[10px] md:text-sm uppercase tracking-wider z-10 pointer-events-none"
                   style={{
                      transform: `rotate(${textRotate}deg)`,
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.5)',
                   }}
                 >
                   <div className="max-w-[80px] md:max-w-[120px] text-center drop-shadow-md px-2 break-words" style={{ filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.8))' }}>{prize.name}</div>
                 </div>
               )
            })}
          </div>
          
          
          {/* Vòng tỏa sáng của nút Quay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-28 md:h-28 rounded-full pointer-events-none z-10" style={{ animation: 'ringPulse 2s infinite' }}></div>

          <button 
             onClick={handleSpin}
             disabled={spinning || prizes.length === 0}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-28 md:h-28 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 border-[6px] md:border-[8px] border-gray-900 rounded-full font-black text-gray-900 shadow-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 z-20 overflow-hidden group/btn"
          >
             {spinning ? <span className="animate-pulse">ĐANG<br/>QUAY</span> : <span className="text-xl md:text-2xl drop-shadow-sm group-hover/btn:scale-110 transition-transform">QUAY</span>}
          </button>
        </div>

        <div className="text-white/70 text-sm md:text-base mb-8 max-w-lg text-center px-6">
          Giới hạn: <b>1 lượt quay / ngày</b> đối với mỗi tài khoản. Các mã giảm giá sẽ được lưu trong mục cá nhân của bạn sau khi trúng.
        </div>
      </div>
    </div>
  )
}

export default LuckyWheel;
