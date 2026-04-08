import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function FashionBattle() {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOngoingBattles();
    window.scrollTo(0, 0);
  }, []);

  const fetchOngoingBattles = async () => {
    try {
      const res = await api.get('/battles/ongoing');
      setBattles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeLeft = (endTime) => {
    const difference = +new Date(endTime) - +new Date();
    if (difference > 0) {
      return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24) + Math.floor(difference / (1000 * 60 * 60 * 24)) * 24,
        minutes: Math.floor((difference / 1000 / 60) % 60),
      };
    }
    return null;
  };

  return (
    <>
      <Navbar />
      <div className="bg-[#1a1a1a] min-h-screen text-white pt-24 pb-12 font-sans relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              FASHION BATTLE
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              Bình chọn cho sản phẩm bạn yêu thích. Sản phẩm chiến thắng sẽ nhận được mức giảm giá siêu khủng!
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
          ) : battles.length === 0 ? (
            <div className="text-center py-20 bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-800">
              <div className="text-6xl mb-4 opacity-50">⚔️</div>
              <h2 className="text-2xl font-bold text-gray-400">Hiện chưa có trận battle nào đang diễn ra!</h2>
              <p className="text-gray-500 mt-2">Vui lòng quay lại sau nhé.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {battles.map(battle => {
                const timeLeft = calculateTimeLeft(battle.endTime);
                return (
                  <div key={battle._id} className="bg-gray-900 rounded-[2rem] p-6 shadow-2xl border border-gray-800 hover:border-amber-500/50 transition-all duration-500 group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-[2rem] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <img src={battle.shop?.image ? (battle.shop.image.startsWith('http') ? battle.shop.image : `http://localhost:5000${battle.shop.image}`) : 'https://placehold.co/100'} alt="Shop" className="w-12 h-12 rounded-full object-cover border-2 border-gray-700" />
                      <div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-1">{battle.name}</h3>
                        <p className="text-gray-400 text-sm">{battle.shop?.name}</p>
                      </div>
                    </div>

                    <div className="mb-6 bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 relative z-10 flex justify-between items-center">
                       <div>
                         <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Cơ hội giảm</p>
                         <p className="text-3xl font-black text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">{battle.discountPercentage}%</p>
                       </div>
                       <div className="text-right">
                         <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Kết thúc sau</p>
                         {timeLeft ? (
                            <p className="text-xl font-mono font-bold text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]">
                              {timeLeft.hours}h {timeLeft.minutes}m
                            </p>
                         ) : (
                            <p className="text-xl font-bold text-gray-500">Đã kết thúc</p>
                         )}
                       </div>
                    </div>

                    <div className="flex -space-x-4 mb-6 relative z-10 overflow-hidden px-4 justify-center">
                       {battle.products?.map((p, i) => (
                         <div key={p._id} className={`w-16 h-16 rounded-full border-4 border-gray-900 overflow-hidden shadow-lg z-[${10-i}] relative`}>
                            <img src={p.images?.[0]?.url ? (p.images[0].url.startsWith('http') ? p.images[0].url : `http://localhost:5000${p.images[0].url}`) : 'https://placehold.co/100'} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" alt="prod" />
                         </div>
                       ))}
                       {battle.products?.length > 4 && (
                          <div className="w-16 h-16 rounded-full border-4 border-gray-900 bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 relative z-0">
                            +{battle.products.length - 4}
                          </div>
                       )}
                    </div>

                    <Link to={`/fashion-battle/${battle._id}`} className="relative z-10 block w-full text-center py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 font-black uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-[1.02] transition-all duration-300">
                      THAM GIA BÌNH CHỌN
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
