import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import ProductModal from '../components/ProductModal';
import { useCart } from '../context/CartContext';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productGroupMap, setProductGroupMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventRes, productsRes] = await Promise.all([
          api.get(`/events/${id}`),
          api.get(`/product-events?eventId=${id}&status=approved`)
        ]);
        setEvent(eventRes.data);
        
        // Extract products from ProductEvent objects
        const eventProducts = productsRes.data.map(pe => {
          const discount = pe.discountPercentage || eventRes.data.discountPercentage || 0;
          const calculatedEventPrice = discount > 0 ? Math.round(pe.originalPrice * (1 - discount / 100)) : pe.eventPrice;
          return {
            ...pe.product,
            eventPrice: calculatedEventPrice,
            originalPrice: pe.originalPrice,
            discountPercentage: discount,
            shop: pe.shop
          };
        });
        
        const unique = [];
        const groupMap = {};
        eventProducts.forEach(p => {
          if (!groupMap[p.name]) {
            groupMap[p.name] = [];
            unique.push(p);
          }
          groupMap[p.name].push(p._id);
        });
        
        setProducts(unique);
        setProductGroupMap(groupMap);
      } catch (err) {
        console.error("Error fetching event data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [id]);

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-40 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy sự kiện</h2>
          <button onClick={() => navigate('/')} className="mt-4 bg-amber-500 text-white px-6 py-2 rounded-lg">Quay lại trang chủ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20">
      <Navbar />
      
      {/* Banner Section */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden mt-32 md:mt-40">
        <img 
          src={event.thumbnailImage ? (event.thumbnailImage.startsWith('http') ? event.thumbnailImage : `http://localhost:5000${event.thumbnailImage}`) : `https://picsum.photos/seed/${event._id}/1920/600`} 
          className="w-full h-full object-cover"
          alt={event.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl bg-white/20 backdrop-blur p-2 rounded-xl border border-white/30">{event.eventType?.icon || '🎉'}</span>
              <span className="text-white font-bold uppercase tracking-[0.3em] text-sm brightness-125">{event.eventType?.label}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4 drop-shadow-xl">
              {event.name}
            </h1>
            <p className="text-gray-200 max-w-2xl text-sm md:text-base mb-6 font-medium shadow-black drop-shadow-md">
              {event.description}
            </p>
            {event.discountPercentage > 0 && (
              <div className="inline-block bg-amber-500 text-gray-900 font-black px-6 py-2 rounded-full uppercase italic tracking-widest shadow-lg transform -rotate-1">
                Giảm đến {event.discountPercentage}%
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
           <div className="flex flex-col">
             <h2 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">
                Sản phẩm <span className="text-amber-500">Đang Tham Gia</span>
             </h2>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Ưu đãi độc quyền chỉ có tại sự kiện</p>
           </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {products.map(product => (
              <div 
                key={product._id} 
                onClick={() => openProductModal(product)}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full cursor-pointer overflow-hidden p-2"
              >
                <div className="w-full aspect-square bg-gray-50 overflow-hidden relative rounded-xl shadow-inner-sm">
                  <img 
                    src={product.images && product.images.length > 0 
                      ? (product.images[0].url.startsWith('http') ? product.images[0].url : `http://localhost:5000${product.images[0].url}`) 
                      : `https://picsum.photos/seed/${product._id}/400/400`} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" 
                  />
                  {product.discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-gray-900 px-2 py-0.5 rounded-lg text-[10px] font-black z-30 shadow-md">
                      -{product.discountPercentage}%
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                    <button className="w-4/5 bg-amber-500 text-gray-900 font-black py-2 rounded-lg text-[10px] uppercase transition-all hover:bg-white active:scale-95">XEM CHI TIẾT</button>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-[12px] text-gray-800 line-clamp-2 leading-tight mb-2 font-black group-hover:text-amber-500 uppercase italic transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                      <div className="text-[#d0011b] font-black text-sm italic">{formatPrice(product.eventPrice || product.price)}</div>
                      {product.eventPrice < product.originalPrice && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                          <span className="text-[9px] bg-red-100 text-[#d0011b] px-1 rounded-sm font-bold">-{product.discountPercentage}%</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Shop: {product.shop?.name}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-black">Chỉ còn {product.stock?.[0] || 0} SP</span>
                      </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[3rem] shadow-xl border border-gray-100">
             <span className="text-7xl mb-6 block grayscale">📦</span>
             <h2 className="text-2xl font-black uppercase italic text-gray-900">Chưa có sản phẩm nào tham gia</h2>
             <p className="text-gray-400 text-xs mt-2 uppercase font-bold tracking-widest">Sản phẩm đang được cập nhật, hãy quay lại sau nhé!</p>
          </div>
        )}
      </div>

      <ProductModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        productGroupMap={productGroupMap} 
      />
    </div>
  );
}
