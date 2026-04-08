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
      const couponCode = res.data.couponCode;
      
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
        if (res.data.isWinner) {
           const code = couponCode || 'ERROR';
           
           // Hiệu ứng pháo hoa bắn 2 bên hoành tráng
           const duration = 4000;
           const end = Date.now() + duration;

           (function frame() {
              confetti({
                particleCount: 10,
                angle: 60,
                spread: 70,
                origin: { x: 0, y: 0.8 },
                colors: ['#fbbf24', '#f59e0b', '#ffffff', '#ef4444'],
                zIndex: 10000
              });
              confetti({
                particleCount: 10,
                angle: 120,
                spread: 70,
                origin: { x: 1, y: 0.8 },
                colors: ['#fbbf24', '#f59e0b', '#ffffff', '#ef4444'],
                zIndex: 10000
              });

              if (Date.now() < end) {
                requestAnimationFrame(frame);
              }
           }());

           // Nổ chùm lớn ở giữa
           confetti({
             particleCount: 250,
             spread: 160,
             origin: { y: 0.5 },
             colors: ['#fbbf24', '#ea580c', '#ffffff'],
             zIndex: 10000
           });

           // Swal Trúng Thưởng
           Swal.fire({
             title: '🎊 XUẤT SẮC! BẠN ĐÃ TRÚNG GIẢI 🎊',
             html: `Chúc mừng bạn! May mắn đã gọi tên bạn.<br/><br/>Phần thưởng: <br/><b style="color: #d946ef; font-size: 22px; text-transform: uppercase;">${wonPrize.name}</b><br/><br/>Mã voucher định danh của bạn:<br/><br/><b style="font-size: 34px; color: #dc2626; background: #fff1f2; padding: 12px 24px; border-radius: 16px; border: 3px dashed #fda4af; display: inline-block; box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.2); letter-spacing: 3px; font-family: monospace;">${code}</b>`,
             icon: 'success',
             iconHtml: '🏆',
             customClass: {
               icon: 'border-0 scale-150 mb-4',
               popup: 'rounded-[40px] border-[6px] border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.6)]',
               title: 'text-gray-900 font-black text-3xl uppercase tracking-tighter',
             },
             background: '#fff url("https://www.transparenttextures.com/patterns/white-diamond.png")',
             width: 550,
             padding: '3em',
             confirmButtonColor: '#10b981',
             confirmButtonText: '<b style="font-size: 18px;">SAO CHÉP MÃ & NHẬN QUÀ 🎁</b>',
             backdrop: `rgba(0,0,0,0.85)`
           }).then((result) => {
             if (result.isConfirmed) {
               navigator.clipboard.writeText(code);
               Swal.fire({
                 title: 'Đã lưu!',
                 text: 'Mã giảm giá đã sẵn trong khay nhớ tạm.',
                 icon: 'success',
                 timer: 1500,
                 showConfirmButton: false
               });
             }
           });
        } else {
           Swal.fire({
             title: 'TIẾC QUÁ!',
             text: wonPrize.name || 'Hôm nay thần may mắn chưa mỉm cười với bạn rồi...',
             imageUrl: 'https://cdn-icons-png.flaticon.com/512/42/42901.png',
             imageWidth: 120,
             imageHeight: 120,
             confirmButtonColor: '#6366f1',
             confirmButtonText: 'QUAY LẠI MAI THỬ TIẾP',
             customClass: {
                popup: 'rounded-[30px] border-4 border-indigo-200 shadow-2xl',
                title: 'font-black text-2xl text-indigo-900'
             }
           });
        }
      }, 5200);

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
          0%, 100% { opacity: 0.3; transform: scale(0.8); background-color: #f5d0fe; }
          50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 15px #fff, 0 0 30px #fef08a, 0 0 45px #fbbf24; background-color: #fff; }
        }
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); transform: translate(-50%, -50%) scale(1); }
          70% { box-shadow: 0 0 0 40px rgba(245, 158, 11, 0); transform: translate(-50%, -50%) scale(1.1); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes shine {
          0% { left: -100%; top: -100%; }
          100% { left: 100%; top: 100%; }
        }
      `}</style>
      <Navbar />
      <div className="flex-1 bg-gradient-to-br from-gray-900 to-black flex flex-col pt-44 pb-20 items-center justify-center relative overflow-hidden">
        {/* Pattern chìm */}
        <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fbbf24 2px, transparent 2px)', backgroundSize: '40px 40px', animation: 'starTwinkle 6s ease-in-out infinite' }}></div>
        
        <div className="z-10 text-center mb-12 px-4">
           <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600 drop-shadow-2xl mb-4" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.8))' }}>VÒNG QUAY MAY MẮN</h1>
           <p className="text-white text-lg md:text-2xl font-bold bg-white/5 inline-block px-6 py-2 rounded-full backdrop-blur-sm border border-amber-500/20">Thử vận may mỗi ngày - Nhận ngay voucher khủng!</p>
        </div>

        <div className="relative z-10 w-[340px] h-[340px] md:w-[540px] md:h-[540px] mb-8 group" style={{ animation: 'float 5s ease-in-out infinite' }}>
          {/* Mũi tên - Thiết kế 3D hơn */}
          <div className="absolute -top-8 md:-top-12 left-1/2 -translate-x-1/2 z-40">
             <div className="relative w-10 md:w-16 h-12 md:h-20 flex justify-center items-center drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
               <svg viewBox="0 0 24 24" fill="url(#arrowGrad)" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#fcd34d', stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#ea580c', stopOpacity:1}} />
                    </linearGradient>
                  </defs>
                  <path d="M12 24L2 0L22 0L12 24Z"/>
               </svg>
             </div>
          </div>

          {/* Vỏ ngoài Kim loại 3D (Outer Mirror Rim) */}
          <div className="absolute inset-[-15px] md:inset-[-25px] rounded-full bg-gradient-to-br from-amber-200 via-amber-600 to-amber-900 border-[4px] border-amber-300 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_5px_15px_rgba(255,255,255,0.4)] pointer-events-none z-0"></div>

          {/* Đèn vòm chạy quanh kim */}
          {[...Array(24)].map((_, i) => (
             <div
               key={`bulb-${i}`}
               className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none z-10"
               style={{ transform: `translate(-50%, -50%) rotate(${i * 15}deg)` }}
             >
               <div 
                 className="absolute top-[-10px] md:-top-5 left-1/2 w-2.5 h-2.5 md:w-4 md:h-4 rounded-full bg-white transition-all duration-300 z-10"
                 style={{ 
                   transform: 'translateX(-50%)',
                   animation: `bulbBlink 1.5s infinite ${i % 3 === 0 ? '0s' : i % 3 === 1 ? '0.5s' : '1s'}`,
                 }}
               ></div>
             </div>
          ))}

          {/* Disc */}
          <div 
            className="w-full h-full rounded-full border-[10px] md:border-[18px] border-[#1a1a1a] relative overflow-hidden z-20 shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.3)]"
            style={{
               background: getGradient(),
               transform: `rotate(${rotation}deg)`,
               transition: 'transform 5.2s cubic-bezier(0.1, 0.85, 0.1, 1)' 
            }}
          >
            {/* Kẻ đường viền chia các ô */}
            {prizes.length > 0 && prizes.map((_, idx) => {
               const sliceAngle = 360 / prizes.length;
               const lineRotate = idx * sliceAngle;
               return (
                 <div 
                   key={`line-${idx}`}
                   className="absolute top-0 left-1/2 w-[1px] md:w-[2px] h-1/2 bg-white/30 origin-bottom z-0"
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
                   className="absolute inset-0 flex justify-center items-start pt-8 md:pt-14 z-10 pointer-events-none"
                   style={{ transform: `rotate(${textRotate}deg)` }}
                 >
                   <div className="max-w-[100px] md:max-w-[150px] flex flex-col items-center">
                     <span 
                      className="font-black text-white text-[9px] md:text-[15px] uppercase tracking-tighter text-center leading-tight [text-shadow:_0_2px_4px_rgba(0,0,0,0.8)]"
                      style={{ WebkitTextStroke: '0.2px rgba(0,0,0,0.3)' }}
                     >
                       {prize.name}
                     </span>
                     {prize.discount > 0 && (
                        <div className="mt-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-white/20 backdrop-blur-sm rounded-md border border-white/30 text-[7px] md:text-[10px] font-bold text-white uppercase tracking-widest">
                           {prize.discount > 100 ? `${(prize.discount / 1000)}K` : `${prize.discount}%`}
                        </div>
                     )}
                   </div>
                 </div>
               )
            })}
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-20"></div>
          </div>
          
          {/* Inner Mirror Shadow */}
          <div className="absolute inset-0 rounded-full border-[12px] md:border-[20px] border-white/5 z-20 pointer-events-none"></div>
          
          {/* Vòng tỏa sáng của nút Quay */}
          <div className="absolute top-1/2 left-1/2 w-28 h-28 md:w-44 md:h-44 rounded-full pointer-events-none z-30" style={{ animation: 'ringPulse 2.5s infinite' }}></div>

          <button 
             onClick={handleSpin}
             disabled={spinning || prizes.length === 0}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-36 md:h-36 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-[8px] md:border-[12px] border-[#1a1a1a] rounded-full font-black text-[#1a1a1a] shadow-[0_15px_30px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.5)] flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-90 z-40 overflow-hidden group/btn"
          >
             {/* Shine Effect on Button */}
             <div className="absolute w-[200%] h-[200%] bg-gradient-to-br from-white/40 via-transparent to-transparent -translate-x-full -translate-y-full transition-transform duration-1000 group-hover/btn:translate-x-0 group-hover/btn:translate-y-0 z-0"></div>

             {spinning ? (
                <div className="flex flex-col items-center z-10">
                   <div className="w-6 h-6 md:w-10 md:h-10 border-4 border-gray-900/30 border-t-gray-900 rounded-full animate-spin mb-1"></div>
                   <span className="text-[10px] md:text-sm tracking-widest font-black uppercase">ĐANG<br/>QUAY</span>
                </div>
             ) : (
                <div className="z-10 flex flex-col items-center">
                   <span className="text-2xl md:text-4xl drop-shadow-md group-hover/btn:scale-110 transition-transform">QUAY</span>
                   <span className="text-[8px] md:text-[10px] opacity-70 tracking-tighter">MAY MẮN</span>
                </div>
             )}
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
