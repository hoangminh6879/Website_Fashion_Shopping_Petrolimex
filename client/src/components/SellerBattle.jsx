import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function SellerBattle({ shop }) {
  const [battles, setBattles] = useState([]);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [endTime, setEndTime] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

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
      return Swal.fire('Lỗi', 'Vui lòng chọn ít nhất 2 sản phẩm', 'error');
    }
    if (!name || !endTime || !discountPercentage) {
      return Swal.fire('Lỗi', 'Vui lòng nhập đủ thông tin', 'error');
    }
    
    setLoading(true);
    try {
      await api.post('/battles', {
        name,
        endTime,
        discountPercentage: Number(discountPercentage),
        products: selectedProducts
      });
      Swal.fire('Thành công', 'Đã tạo trận battle thành công', 'success');
      setName('');
      setEndTime('');
      setDiscountPercentage('');
      setSelectedProducts([]);
      fetchBattles();
    } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#FBFBFB] min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 font-serif uppercase pb-2 border-b-2 border-amber-500 w-max">
        Fashion Battle
      </h2>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-xl font-bold mb-4">Tạo Trận Battle Mới</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Tên Trận Battle</label>
              <input type="text" value={name} onChange={r => setName(r.target.value)} className="w-full border p-2 rounded" placeholder="VD: Trận chiến giày Sneaker hè 2026..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Thời gian kết thúc</label>
              <input type="datetime-local" value={endTime} onChange={r => setEndTime(r.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phần trăm giảm giá (nếu thắng)</label>
              <input type="number" min="1" max="100" value={discountPercentage} onChange={r => setDiscountPercentage(r.target.value)} className="w-full border p-2 rounded" placeholder="VD: 30" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2 mt-4">Chọn sản phẩm tham gia (Ít nhất 2 sản phẩm - Không giới hạn số lượng)</label>
            <div className="h-64 overflow-y-auto border p-4 rounded grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-gray-50">
              {products.map(p => (
                <label key={p._id} className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition ${selectedProducts.includes(p._id) ? 'bg-amber-100 border-amber-500' : 'bg-white border-gray-200 hover:bg-gray-100'}`}>
                  <input type="checkbox" checked={selectedProducts.includes(p._id)} onChange={() => toggleProduct(p._id)} className="w-4 h-4" />
                  <div className="text-sm truncate">{p.name} - {p.price.toLocaleString()}đ</div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Đã chọn: <span className="font-bold text-amber-600">{selectedProducts.length} sản phẩm</span></p>
          </div>

          <button type="submit" disabled={loading} className="px-6 py-2 bg-amber-500 text-white font-bold rounded shadow hover:bg-amber-600 transition disabled:opacity-50 mt-4 block w-full">
            {loading ? 'Đang tạo...' : 'Tạo Trận Battle'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Danh Sách Trận Battle</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border text-sm">
            <thead className="bg-gray-100 uppercase font-semibold text-gray-700">
              <tr>
                <th className="p-3 text-left">Tên Battle</th>
                <th className="p-3 text-left">Kết thúc</th>
                <th className="p-3 text-center">Giảm giá</th>
                <th className="p-3 text-center">Sản phẩm</th>
                <th className="p-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {battles.map(b => (
                <tr key={b._id} className="border-b transition hover:bg-gray-50">
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3">{new Date(b.endTime).toLocaleString('vi-VN')}</td>
                  <td className="p-3 text-center text-red-500 font-bold">{b.discountPercentage}%</td>
                  <td className="p-3 text-center">{b.products?.length || 0}</td>
                  <td className="p-3 text-center">
                    {b.status === 'ongoing' ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">ĐANG DIỄN RA</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">ĐÃ KẾT THÚC</span>
                    )}
                  </td>
                </tr>
              ))}
              {battles.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">Chưa có trận battle nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
