import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  
  // Category Form State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    try {
      if (tab === "overview") {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } else if (tab === "users") {
        const res = await api.get("/admin/users");
        setUsers(res.data);
      } else if (tab === "shops") {
        const res = await api.get("/admin/shops");
        setShops(res.data);
      } else if (tab === "categories") {
        const res = await api.get("/categories");
        setCategories(res.data);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        Swal.fire("Lỗi", "Bạn không có quyền truy cập", "error");
        navigate("/");
      } else {
        console.error("Lỗi lấy dữ liệu:", err);
      }
    }
  };

  const handleSellerRequest = async (userId, action) => {
    try {
      await api.put(`/admin/users/${userId}/approve-seller`, { action });
      Swal.fire("Thành công", action === 'approve' ? "Đã cập nhật yêu cầu mở shop" : "Đã từ chối yêu cầu", "success");
      fetchData("users"); // reload
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi xử lý yêu cầu", "error");
    }
  };

  const handleShopStatus = async (shopId, status) => {
    try {
      await api.put(`/admin/shops/${shopId}/status`, { status });
      Swal.fire("Thành công", status === 'active' ? "Đã duyệt cửa hàng" : "Đã từ chối cửa hàng", "success");
      fetchData("shops");
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi xử lý cửa hàng", "error");
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      Swal.fire("Thành công", `Đã cấp quyền ${newRole}`, "success");
      fetchData("users"); // reload
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi đổi quyền", "error");
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Swal.fire("Lỗi", "Vui lòng nhập tên danh mục", "warning");
      return;
    }
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, { name: categoryName });
        Swal.fire("Thành công", "Đã cập nhật danh mục", "success");
      } else {
        await api.post("/categories", { name: categoryName });
        Swal.fire("Thành công", "Đã thêm danh mục mới", "success");
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryName("");
      fetchData("categories");
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi lưu danh mục", "error");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm("Chắc chắn xóa danh mục này? Các sản phẩm thuộc danh mục sẽ không bị xóa.")) {
      try {
        await api.delete(`/categories/${id}`);
        Swal.fire("Thành công", "Đã xóa danh mục", "success");
        fetchData("categories");
      } catch (err) {
        Swal.fire("Lỗi", err.response?.data?.message || "Lỗi xóa danh mục", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-amber-900/50 sticky top-0 z-50 py-4 px-6 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">
            ADMIN PANEL
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-semibold transition"
        >
          Trang chủ
        </button>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-4 border border-gray-100 flex flex-col gap-2 sticky top-24">
            <button
              onClick={() => setActiveTab("overview")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "overview" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📊 Tổng quan
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "users" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              👥 Người dùng
            </button>
            <button
              onClick={() => setActiveTab("upgrade_requests")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all flex justify-between items-center ${
                activeTab === "upgrade_requests" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>⭐ Yêu cầu nâng cấp</span>
              {users.filter(u => u.sellerRequest?.status === 'pending' && u.role !== 'seller').length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {users.filter(u => u.sellerRequest?.status === 'pending' && u.role !== 'seller').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("shops")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "shops" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🏪 Cửa hàng
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`text-left px-5 py-3 rounded-xl font-bold transition-all ${
                activeTab === "categories" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🏷️ Danh mục
            </button>
          </div>
        </aside>

        {/* Cột hiển thị dữ liệu chính */}
        <main className="flex-1 bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
          
          {/* TAB: Tổng quan */}
          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Thống kê hệ thống</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
                  <div className="text-blue-500 text-4xl mb-2 font-black">{stats.totalUsers || 0}</div>
                  <div className="text-blue-800 font-semibold text-sm uppercase">Người dùng</div>
                </div>
                <div className="bg-green-50 border border-green-100 p-6 rounded-2xl text-center">
                  <div className="text-green-500 text-4xl mb-2 font-black">{stats.totalShops || 0}</div>
                  <div className="text-green-800 font-semibold text-sm uppercase">Cửa hàng</div>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl text-center">
                  <div className="text-purple-500 text-4xl mb-2 font-black">{stats.totalProducts || 0}</div>
                  <div className="text-purple-800 font-semibold text-sm uppercase">Sản phẩm</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-center">
                  <div className="text-amber-500 text-4xl mb-2 font-black">{stats.totalOrders || 0}</div>
                  <div className="text-amber-800 font-semibold text-sm uppercase">Đơn hàng</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Người dùng */}
          {activeTab === "users" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Quản lý người dùng</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Tên</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Quyền</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.filter(u => !(u.sellerRequest?.status === 'pending' && u.role !== 'seller')).map(u => (
                      <tr key={u._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 text-gray-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'seller' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {u.sellerRequest?.status === 'rejected' ? (
                            <span className="text-red-500 font-medium select-none">Từng bị từ chối</span>
                          ) : (
                            <span className="text-green-600 font-medium select-none">Bình thường</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {u.role !== 'admin' && (
                              <button 
                                onClick={() => {
                                  if (confirm("Chắc chắn cấp quyền Admin thay vì User/Seller?")) {
                                    handleChangeRole(u._id, 'admin')
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded border border-red-200 text-xs font-bold transition"
                              >
                                Cấp Admin
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => !(u.sellerRequest?.status === 'pending' && u.role !== 'seller')).length === 0 && (
                      <tr><td colSpan="5" className="text-center py-8 text-gray-400">Không có người dùng nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Yêu cầu nâng cấp */}
          {activeTab === "upgrade_requests" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">Yêu cầu nâng cấp Seller</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Người dùng</th>
                      <th className="px-6 py-4">Lý do mở shop</th>
                      <th className="px-6 py-4 text-center">Ảnh minh chứng</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.filter(u => u.sellerRequest?.status === 'pending' && u.role !== 'seller').map(u => (
                      <tr key={u._id} className="hover:bg-amber-50/50 transition border-l-4 border-l-amber-500">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 italic whitespace-normal max-w-sm">
                          "{u.sellerRequest.reason}"
                        </td>
                        <td className="px-6 py-4 text-center">
                          <a href={`http://localhost:5000${u.sellerRequest.proofImage}`} target="_blank" rel="noreferrer" className="inline-block hover:scale-105 transition">
                            <img src={`http://localhost:5000${u.sellerRequest.proofImage}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm inline-block" alt="minh chứng" />
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <button 
                              onClick={() => handleSellerRequest(u._id, 'approve')}
                              className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded shadow-sm text-xs font-bold transition"
                            >
                              Duyệt (Nâng Seller)
                            </button>
                            <button 
                              onClick={() => handleSellerRequest(u._id, 'reject')}
                              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded shadow-sm text-xs font-bold transition"
                            >
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => u.sellerRequest?.status === 'pending' && u.role !== 'seller').length === 0 && (
                      <tr><td colSpan="4" className="text-center py-12 text-gray-400 font-medium">✨ Hiện không có yêu cầu nâng cấp nào đang chờ xử lý.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Cửa hàng */}
          {activeTab === "shops" && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6">Quản lý cửa hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shops.map(shop => (
                  <div key={shop._id} className="border border-gray-100 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition">
                    <img 
                      src={`http://localhost:5000${shop.image}`} 
                      onError={(e) => e.target.src="https://picsum.photos/150"}
                      className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                    />
                    <div className="flex flex-col justify-center flex-1">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{shop.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Chủ: <span className="font-semibold">{shop.owner?.name || "Không rõ"}</span>
                      </p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full w-max ${
                          shop.status === 'active' ? 'bg-green-100 text-green-700' :
                          shop.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {shop.status === 'active' ? 'Đang hoạt động' : 
                           shop.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                        </span>
                        
                        {shop.status === 'pending' && (
                          <div className="flex items-center gap-2 ml-auto">
                            <button 
                              onClick={() => handleShopStatus(shop._id, 'active')}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs font-bold rounded shadow transition"
                            >
                              Duyệt
                            </button>
                            <button 
                              onClick={() => handleShopStatus(shop._id, 'rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs font-bold rounded shadow transition"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {shops.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">Không có cửa hàng nào được tạo.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Danh mục */}
          {activeTab === "categories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Quản lý danh mục</h2>
                <button 
                  onClick={() => { setEditingCategory(null); setCategoryName(""); setShowCategoryModal(true); }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/30 transition"
                >
                  + Thêm danh mục
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Tên danh mục</th>
                      <th className="px-6 py-4">Slug (Đường dẫn)</th>
                      <th className="px-6 py-4">Cấp quản lý</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map(cat => (
                      <tr key={cat._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {cat.parent ? cat.parent.name : <span className="text-amber-600 font-semibold border border-amber-200 bg-amber-50 px-2 py-0.5 rounded text-xs">Gốc</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); setShowCategoryModal(true); }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded shadow-sm text-xs font-bold transition border border-blue-200"
                            >
                              Sửa
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded shadow-sm text-xs font-bold transition border border-red-200"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-8 text-gray-400">Không có danh mục nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL THÊM/SỬA DANH MỤC */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-gray-900 mb-6 uppercase">
              {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên danh mục</label>
                <input 
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Nhập tên danh mục (vd: Áo thun)"
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition font-bold"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryName(""); }}
                className="flex-1 bg-gray-100 text-gray-600 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveCategory}
                className="flex-1 bg-amber-500 text-gray-900 font-black uppercase py-4 rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition"
              >
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
