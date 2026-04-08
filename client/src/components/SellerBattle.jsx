import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

// Simple Icon Components
const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

export default function SellerBattle({ shop }) {
  const navigate = useNavigate();
  const [battles, setBattles] = useState([]);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [endTime, setEndTime] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBattles();
    fetchProducts();
  }, []);

  const fetchBattles = async () => {
    try {
      const res = await api.get('/battles/seller/list');
      setBattles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/seller-products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleProduct = (id) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) return prev.filter(pId => pId !== id);
      return [...prev, id];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length < 2) {
      return Swal.fire('Lỗi', 'Vui lòng chọn ít nhất 2 sản phẩm để bắt đầu trận chiến', 'error');
    }
    if (!name || !endTime || !discountPercentage) {
      return Swal.fire('Lỗi', 'Vui lòng nhập đầy đủ thông tin trận chiến', 'error');
    }
    
    setLoading(true);
    try {
      await api.post('/battles', {
        name,
        endTime,
        discountPercentage: Number(discountPercentage),
        products: selectedProducts
      });
      Swal.fire({
        title: 'Thành công',
        text: 'Trận chiến thời trang đã được khởi tạo!',
        icon: 'success',
        confirmButtonColor: '#D4AF37'
      });
      setName('');
      setEndTime('');
      setDiscountPercentage('');
      setSelectedProducts([]);
      setShowCreateForm(false);
      fetchBattles();
    } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra khi tạo battle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-[#FDFDFD] min-h-screen font-sans text-gray-800">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 font-serif tracking-tight flex items-center gap-3">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl shadow-inner">
              <IconTrophy />
            </span>
            Fashion Battle
          </h2>
          <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
            Quản lý và tạo các cuộc đối đầu thời trang để kích cầu mua sắm.
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 shadow-lg hover:shadow-amber-200/50 ${
            showCreateForm 
            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
            : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:scale-105 active:scale-95'
          }`}
        >
          {showCreateForm ? (
            <>Hủy Thao Tác</>
          ) : (
            <>
              <IconPlus />
              Tạo Trận Chiến Mới
            </>
          )}
        </button>
      </div>

      {/* Creation form (Conditionally Rendered) */}
      {showCreateForm && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs">1</div>
              Thiết lập trận chiến mới
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Tên Cuộc Đối Đầu</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={r => setName(r.target.value)} 
                    className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500 p-4 rounded-2xl transition-all" 
                    placeholder="VD: Sneaker Heritage vs Modern Tech..." 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Thời gian kết thúc</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconCalendar />
                      </div>
                      <input 
                        type="datetime-local" 
                        value={endTime} 
                        onChange={r => setEndTime(r.target.value)} 
                        className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500 p-4 pl-12 rounded-2xl transition-all" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Ưu đãi hoàn tất (%)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={discountPercentage} 
                      onChange={r => setDiscountPercentage(r.target.value)} 
                      className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500 p-4 rounded-2xl transition-all font-mono text-lg font-bold text-red-600" 
                      placeholder="VD: 30" 
                    />
                    <p className="text-[10px] text-slate-400 mt-1 italic">* Giảm giá áp dụng cho mẫu chiến thắng sau khi kết thúc.</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                <h4 className="font-bold text-amber-900 mb-4 flex items-center justify-between">
                  Đã Chọn
                  <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs animate-pulse">
                    {selectedProducts.length} sản phẩm
                  </span>
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedProducts.length === 0 ? (
                    <div className="text-center py-8 text-amber-400 text-sm italic">
                      Chưa có sản phẩm nào được chọn
                    </div>
                  ) : (
                    selectedProducts.map(id => {
                      const p = products.find(prod => prod._id === id);
                      return p ? (
                        <div key={id} className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-amber-200 animate-in slide-in-from-right-4">
                          <img src={p.images?.[0]?.url ? (p.images[0].url.startsWith('http') ? p.images[0].url : `http://localhost:5000${p.images[0].url}`) : 'https://placehold.co/100'} alt="" className="w-10 h-10 object-cover rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{p.price?.toLocaleString()}đ</p>
                          </div>
                          <button type="button" onClick={() => toggleProduct(id)} className="text-red-400 hover:text-red-600 p-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      ) : null;
                    })
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs text-white">2</div>
                  Lựa chọn ứng viên tham chiến
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <IconSearch />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-amber-500 w-64 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 h-[380px] overflow-y-auto p-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                {filteredProducts.map(p => {
                  const isSelected = selectedProducts.includes(p._id);
                  return (
                    <div 
                      key={p._id} 
                      onClick={() => toggleProduct(p._id)}
                      className={`group relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                        isSelected 
                        ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-100' 
                        : 'border-white bg-white hover:border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="aspect-square overflow-hidden bg-slate-100">
                        <img 
                          src={p.images?.[0]?.url ? (p.images[0].url.startsWith('http') ? p.images[0].url : `http://localhost:5000${p.images[0].url}`) : 'https://placehold.co/300'} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      </div>
                      <div className="p-3">
                        <h5 className={`text-xs font-bold truncate ${isSelected ? 'text-amber-700' : 'text-slate-800'}`}>{p.name}</h5>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">{p.price?.toLocaleString()}đ</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-lg border-2 border-white">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <IconSearch />
                    </div>
                    <p>Không tìm thấy sản phẩm nào khớp với tìm kiếm.</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-10 py-5 bg-slate-900 text-white text-lg font-black rounded-2xl shadow-xl hover:bg-black hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Xác Nhận Khởi Tạo Trận Chiến</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Battle List Grid */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Chiến Dịch Đang Chạy
          <span className="text-sm font-normal text-slate-400">({battles.length})</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {battles.map(b => (
          <div key={b._id} className="bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                {b.status === 'ongoing' ? (
                  <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                    Đang Diễn Ra
                  </div>
                ) : (
                  <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    Đã Kết Thúc
                  </div>
                )}
                <div className="bg-red-50 text-red-600 font-black text-xl px-3 py-1 rounded-xl">
                  -{b.discountPercentage}%
                </div>
              </div>
              
              <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-amber-600 transition-colors uppercase italic tracking-tight">{b.name}</h4>
              
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-6">
                <IconCalendar />
                Kết thúc: <span className="font-bold">{new Date(b.endTime).toLocaleString('vi-VN')}</span>
              </div>

              {/* Preview candidates */}
              <div className="flex items-center justify-center gap-1 mb-6 mt-auto">
                {b.products?.slice(0, 3).map((pid, idx) => {
                  // For the list, we might not have the full product objects unless the API populates them.
                  // Usually, list APIs for battles return at least a summary or we already have products in state.
                  // If we only have IDs, we try to find them in our local products state.
                  const prod = products.find(p => p._id === (pid._id || pid));
                  return (
                    <div key={idx} className={`w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden -ml-4 first:ml-0 transition-transform hover:scale-110 hover:z-10 ${idx === 1 ? 'z-1 relative' : 'z-0'}`}>
                      <img src={prod?.images?.[0]?.url ? (prod.images[0].url.startsWith('http') ? prod.images[0].url : `http://localhost:5000${prod.images[0].url}`) : 'https://placehold.co/200'} alt="" className="w-full h-full object-cover" title={prod?.name} />
                    </div>
                  );
                })}
                {b.products?.length > 3 && (
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-md -ml-4 z-20">
                    +{b.products.length - 3}
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => navigate(`/fashion-battle/${b._id}`)}
              className={`w-full p-4 text-center text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] ${b.status === 'ongoing' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              {b.status === 'ongoing' ? 'THEO DÕI TRẬN CHIẾN' : 'XEM KẾT QUẢ'}
            </button>
          </div>
        ))}
        
        {battles.length === 0 && (
          <div className="col-span-full bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] p-16 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-slate-300">
              <IconTrophy />
            </div>
            <h5 className="text-xl font-bold text-slate-900 mb-2">Chưa có trận chiến nào</h5>
            <p className="text-slate-400 max-w-sm mx-auto mb-8">
              Bắt đầu kích thích sự cạnh tranh giữa các sản phẩm để thu hút người dùng bình chọn và mua sắm!
            </p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-black transition-all"
            >
              Tạo Chiến Dịch Đầu Tiên
            </button>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
}

