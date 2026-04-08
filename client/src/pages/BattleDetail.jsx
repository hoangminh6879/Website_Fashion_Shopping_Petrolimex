import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Swal from 'sweetalert2';
import { useCart } from '../context/CartContext';

export default function BattleDetail() {
  const { id } = useParams();
  const { userRole } = useCart() || {};
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchBattle();
    window.scrollTo(0, 0);

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [id]);

  const fetchBattle = async () => {
    try {
      const res = await api.get(`/battles/${id}`);
      setBattle(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', 'Không thể tải dữ liệu trận battle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (productId) => {
    if (userRole !== 'user') {
      return Swal.fire('Oops...', 'Chỉ tài khoản Người mua (User) mới có thể bình chọn!', 'warning');
    }
    setVotingId(productId);
    try {
      await api.post(`/battles/${id}/vote`, { productId });
      Swal.fire('Thành công', 'Cảm ơn bạn đã bình chọn!', 'success');
      fetchBattle(); // Refresh data to see new percentages
    } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || 'Không thể bình chọn', 'error');
    } finally {
      setVotingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1a1a1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">
        <h2>Không tìm thấy trận battle này!</h2>
      </div>
    );
  }

  const isOngoing = battle.status === 'ongoing' && new Date(battle.endTime) > now;
  
  const calculateTimeLeft = (endTime) => {
    const difference = +new Date(endTime) - +now;
    if (difference > 0) {
      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return '0h 0m 0s';
  };

  return (
    <>
      <Navbar />
      <div className="bg-[#1a1a1a] min-h-screen text-white pt-40 md:pt-48 pb-20 font-sans relative">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12 relative z-10">
            <Link to="/fashion-battle" className="text-amber-500 hover:text-amber-400 mb-4 inline-block font-bold">&larr; QUAY LẠI DANH SÁCH</Link>
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
              {battle.name}
            </h1>
            <div className="flex items-center justify-center gap-3">
              <img src={battle.shop?.image ? (battle.shop.image.startsWith('http') ? battle.shop.image : `http://localhost:5000${battle.shop.image}`) : 'https://placehold.co/100'} alt="Shop" className="w-10 h-10 rounded-full object-cover border border-amber-500" />
              <p className="text-gray-300 font-bold uppercase tracking-widest">{battle.shop?.name}</p>
            </div>
            
            <div className="mt-8 inline-flex items-center gap-6 bg-gray-900 border border-gray-800 rounded-full px-8 py-4 shadow-lg shadow-black/50">
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Giảm giá thắng cuộc</p>
                  <p className="text-2xl font-black text-red-500">{battle.discountPercentage}%</p>
               </div>
               <div className="w-px h-10 bg-gray-800"></div>
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Kết thúc sau</p>
                  <p className={`text-xl font-mono font-bold ${isOngoing ? 'text-amber-500' : 'text-gray-500'}`}>
                    {isOngoing ? calculateTimeLeft(battle.endTime) : 'Đã kết thúc'}
                  </p>
               </div>
               <div className="w-px h-10 bg-gray-800"></div>
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Trạng thái</p>
                  <p className={`text-lg font-black uppercase ${isOngoing ? 'text-green-500' : 'text-gray-500'}`}>
                    {isOngoing ? 'Đang diễn ra' : 'Đã kết thúc'}
                  </p>
               </div>
            </div>
          </div>

          {!isOngoing && battle.winnerProducts && battle.winnerProducts.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/50 rounded-2xl p-6 mb-12 text-center animate-pulse">
               <h2 className="text-2xl font-black text-amber-500 uppercase italic mb-2">🎉 TRẬN BATTLE ĐÃ KẾT THÚC 🎉</h2>
               <p className="text-gray-300">Sản phẩm chiến thắng đã được áp dụng mức giảm giá <span className="font-bold text-white">{battle.discountPercentage}%</span>. Nhanh tay chốt đơn nào!</p>
            </div>
          )}

          {battle.hasVoted && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-2xl p-4 mb-12 text-center text-green-400 font-bold">
               Bạn đã tham gia bình chọn cho trận này! Kết quả đang được cập nhật liên tục bên dưới.
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {battle.products?.map((product) => {
              const isWinner = !isOngoing && battle.winnerProducts?.some(w => w._id === product._id);
              const isVotedByMe = battle.votedProductId === product._id;
              
              return (
                <div key={product._id} className={`relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500
                  ${isWinner ? ' ring-4 ring-amber-500 scale-105 z-10' : 'border border-gray-800 hover:border-gray-600'}
                  ${isVotedByMe ? ' ring-2 ring-green-500 bg-gray-800' : ''}`}>
                  
                  {isWinner && (
                    <div className="absolute top-4 right-4 bg-amber-500 text-gray-900 text-xs font-black px-3 py-1 rounded-full z-20 shadow-lg shadow-amber-500/30">
                      🏆 WINNER
                    </div>
                  )}

                  {isVotedByMe && (
                    <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full z-20">
                      ĐÃ CHỌN
                    </div>
                  )}

                  <div className="aspect-[4/5] relative overflow-hidden group">
                    <img src={product.images?.[0]?.url ? (product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`) : 'https://placehold.co/400'} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 w-full p-6">
                      <h3 className="text-xl font-bold mb-1 leading-tight">{product.name}</h3>
                      <p className="text-amber-500 font-black text-lg">{product.price.toLocaleString()} đ</p>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2 font-mono">
                        <span className="text-gray-400">{product.voteCount} phiếu</span>
                        <span className="text-amber-500 font-bold">{product.votePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                           style={{ width: `${product.votePercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleVote(product._id)}
                      disabled={!isOngoing || battle.hasVoted || votingId === product._id || userRole !== 'user'}
                      className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all duration-300
                        ${(!isOngoing || battle.hasVoted || userRole !== 'user') ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                        : 'bg-white text-gray-900 hover:bg-amber-500 hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95'}`}
                    >
                      {votingId === product._id ? 'Đang gửi...' 
                        : (userRole !== 'user' ? 'Chỉ dành cho Người Mua' 
                        : (battle.hasVoted ? 'Đã Bình Chọn' : 'Bình Chọn'))}
                    </button>
                    
                    <div className="mt-4 text-center">
                       <Link to={`/product/${product._id}`} className="text-xs text-gray-400 uppercase tracking-widest hover:text-white transition-colors underline">Xem chi tiết sản phẩm</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
