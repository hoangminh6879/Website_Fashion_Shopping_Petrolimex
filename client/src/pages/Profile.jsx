import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import Cropper from 'react-easy-crop';
import Navbar from '../components/Navbar';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'security', 'seller'
  const location = useLocation();

  // Personal Info State
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Address Book State
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    receiverName: '', phone: '', street: '', ward: '', district: '', city: '', isDefault: false, lat: 21.0285, lng: 105.8542
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [mapPosition, setMapPosition] = useState({ lat: 21.0285, lng: 105.8542 });

  // Seller Request State
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sellerForm, setSellerForm] = useState({ reason: '', proofImage: '' });
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fileInputRef = useRef(null);
  const proofInputRef = useRef(null);
  const navigate = useNavigate();

  // Cropper State
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['personal', 'security', 'seller'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      setAddresses(res.data.addresses || []);
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        address: res.data.address || ''
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', error => reject(error));
      img.setAttribute('crossOrigin', 'anonymous');
      img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height
    );
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg');
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/auth/me', form);
      setUser(res.data);
      setIsEditing(false);
      Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật thông tin cá nhân!', confirmButtonColor: '#f59e0b' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Không thể cập nhật!', confirmButtonColor: '#f59e0b' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAddressModal = (addr = null) => {
    if (addr) {
      setEditingAddressId(addr._id);
      setAddressForm({
        receiverName: addr.receiverName || '',
        phone: addr.phone || '',
        street: addr.street || '',
        ward: addr.ward || '',
        district: addr.district || '',
        city: addr.city || '',
        isDefault: addr.isDefault || false,
        lat: addr.lat || 21.0285,
        lng: addr.lng || 105.8542
      });
      setMapPosition({ lat: addr.lat || 21.0285, lng: addr.lng || 105.8542 });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        receiverName: '', phone: '', street: '', ward: '', district: '', city: '', isDefault: false, lat: 21.0285, lng: 105.8542
      });
      setMapPosition({ lat: 21.0285, lng: 105.8542 });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    setIsSavingAddress(true);
    try {
      const payload = { ...addressForm, lat: mapPosition.lat, lng: mapPosition.lng };
      if (editingAddressId) {
        const res = await api.put(`/users/addresses/${editingAddressId}`, payload);
        setAddresses(res.data.addresses);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã cập nhật địa chỉ!', confirmButtonColor: '#f59e0b' });
      } else {
        const res = await api.post('/users/addresses', payload);
        setAddresses(res.data.addresses);
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã thêm địa chỉ!', confirmButtonColor: '#f59e0b' });
      }
      setShowAddressModal(false);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Không thể lưu địa chỉ!', confirmButtonColor: '#f59e0b' });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    const result = await Swal.fire({
      title: 'Xóa địa chỉ?',
      text: "Bạn có chắc chắn muốn xóa địa chỉ này?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    });
    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/users/addresses/${id}`);
        setAddresses(res.data.addresses);
        Swal.fire({ icon: 'success', title: 'Đã xóa!', text: 'Địa chỉ đã được xóa.', confirmButtonColor: '#f59e0b' });
      } catch (err) {
        Swal.fire('Lỗi', 'Không thể xóa địa chỉ.', 'error');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleApplyCrop = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const file = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append('image', file);
      setShowCropper(false);
      Swal.fire({ title: 'Đang tải lên...', didOpen: () => Swal.showLoading() });
      const uploadRes = await api.post('/images/upload', formData);
      const updateRes = await api.put('/auth/me', { avatar: uploadRes.data.image.url });
      setUser(updateRes.data);
      Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đã đổi ảnh đại diện!', confirmButtonColor: '#f59e0b' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Lỗi xử lý ảnh!', confirmButtonColor: '#f59e0b' });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return Swal.fire("Lỗi", "Mật khẩu xác nhận không khớp", "warning");
    }
    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      Swal.fire("Thành công", "Đã đổi mật khẩu", "success");
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi đổi mật khẩu", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSellerSubmit = async () => {
    if (!sellerForm.reason || !sellerForm.proofImage) {
      return Swal.fire("Lỗi", "Vui lòng nhập lý do và tải ảnh minh chứng", "warning");
    }
    if (!acceptedTerms) {
      return Swal.fire("Lỗi", "Bạn phải đồng ý với điều khoản", "warning");
    }
    try {
      const res = await api.post('/users/request-seller', sellerForm);
      setUser(res.data.user);
      setShowSellerModal(false);
      Swal.fire("Thành công", "Yêu cầu đã được gửi, vui lòng chờ duyệt!", "success");
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi gửi yêu cầu", "error");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-sans pb-20 overflow-x-hidden">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12 mt-44">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* SIDEBAR */}
          <div className="w-full lg:w-72 space-y-6 flex-shrink-0 animate-fadeInLeft">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img
                  src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : `https://ui-avatars.com/api/?name=${user.name}&background=f59e0b&color=fff&size=200`}
                  className="w-32 h-32 rounded-full border-2 border-white p-1 object-cover shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105"
                  alt="avatar"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-1 right-1 bg-gray-900 text-white p-2.5 rounded-full border-2 border-white shadow-xl hover:bg-amber-500 transition-all z-20 hover:scale-110 active:scale-90"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter text-center line-clamp-1">{user.name}</h2>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2 mb-4">MEMBER ID: {user._id.slice(-6).toUpperCase()}</p>
              <div className="px-6 py-2 bg-gradient-to-r from-gray-900 to-black text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-gray-800 shadow-lg">
                {user.role} Status
              </div>
            </div>

            <nav className="bg-white rounded-[2.5rem] p-4 shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              <div className="space-y-1">
                {[
                  { id: 'personal', label: 'Hồ Sơ Cá Nhân', icon: '👤' },
                  { id: 'security', label: 'Bảo Mật', icon: '🔒' },
                  { id: 'seller', label: 'Kênh Người Bán', icon: '💰', hide: user.role !== 'user' }
                ].filter(item => !item.hide).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-black text-[11px] uppercase tracking-widest ${activeTab === item.id ? 'bg-gray-900 text-amber-500 shadow-xl shadow-gray-300' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <span className="text-xl opacity-80">{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-50 mt-4 pt-4">
                <button
                  onClick={() => { localStorage.removeItem('token'); navigate('/'); window.location.reload(); }}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-red-500 font-black text-[11px] uppercase tracking-widest hover:bg-red-50 transition-all"
                >
                  <span className="text-xl opacity-80">🚪</span> Đăng Xuất
                </button>
              </div>
            </nav>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 w-full animate-fadeInUp">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12 min-h-[650px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-[80px]"></div>

              {/* TAB: Personal Info */}
              {activeTab === 'personal' && (
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-50 pb-8">
                    <div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Chi Tiết <span className="text-amber-500">Tài Khoản</span></h3>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Cập nhật thông tin định danh của bạn</p>
                    </div>
                    <button
                      onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                      className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl ${isEditing ? 'bg-amber-500 text-gray-900 hover:bg-amber-600' : 'bg-gray-900 text-white hover:bg-amber-500 hover:text-gray-900'}`}
                    >
                      {isEditing ? (isSaving ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN') : 'CHỈNH SỬA'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        disabled={!isEditing}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={`w-full px-6 py-4 rounded-2xl font-bold transition-all border-2 text-sm ${isEditing ? 'bg-white border-amber-500/30 focus:border-amber-500 outline-none shadow-xl shadow-amber-500/5' : 'bg-gray-50/50 border-gray-100 text-gray-400 italic cursor-not-allowed'}`}
                        placeholder="Nhập họ và tên đầy đủ"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Địa chỉ Email</label>
                      <div className="relative">
                        <input
                          disabled
                          value={user.email}
                          className="w-full px-6 py-4 rounded-2xl font-bold bg-gray-50/50 border-2 border-gray-100 text-gray-400 italic cursor-not-allowed text-sm"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200">🔒</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Số điện thoại liên hệ</label>
                      <input
                        disabled={!isEditing}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className={`w-full px-6 py-4 rounded-2xl font-bold transition-all border-2 text-sm ${isEditing ? 'bg-white border-amber-500/30 focus:border-amber-500 outline-none shadow-xl shadow-amber-500/5' : 'bg-gray-50/50 border-gray-100 text-gray-400 italic cursor-not-allowed'}`}
                        placeholder="09xx xxx xxx"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Địa chỉ giao hàng mặc định</label>
                      <textarea
                        disabled={!isEditing}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        rows="3"
                        className={`w-full px-6 py-4 rounded-3xl font-bold transition-all border-2 text-sm resize-none ${isEditing ? 'bg-white border-amber-500/30 focus:border-amber-500 outline-none shadow-xl shadow-amber-500/5' : 'bg-gray-50/50 border-gray-100 text-gray-400 italic cursor-not-allowed'}`}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                      />
                    </div>
                  </div>
                  
                  {/* SỔ ĐỊA CHỈ GIAO HÀNG */}
                  {user.role === 'user' && (
                    <div className="md:col-span-2 mt-8 pt-8 border-t border-gray-50">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h4 className="text-xl font-black italic uppercase text-gray-900 tracking-tighter">Sổ Địa Chỉ <span className="text-amber-500">Giao Hàng</span></h4>
                              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mt-1">Quản lý các địa chỉ nhận hàng của bạn</p>
                          </div>
                          <button
                              onClick={() => handleOpenAddressModal()}
                              className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl"
                          >
                              + THÊM ĐỊA CHỈ
                          </button>
                      </div>
                      
                      <div className="space-y-4">
                          {addresses.length === 0 ? (
                              <div className="p-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                  <p className="text-gray-400 text-sm font-bold">Chưa có địa chỉ nào được lưu.</p>
                              </div>
                          ) : (
                              addresses.map(addr => (
                                  <div key={addr._id} className={`p-6 bg-white rounded-3xl border-2 transition-all shadow-sm flex flex-col md:flex-row justify-between gap-4 ${addr.isDefault ? 'border-amber-500 shadow-amber-500/10' : 'border-gray-100 hover:border-gray-200'}`}>
                                      <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                              <h5 className="font-black text-gray-900 uppercase tracking-widest text-sm">{addr.receiverName}</h5>
                                              {addr.isDefault && <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">Mặc định</span>}
                                          </div>
                                          <p className="text-gray-500 text-xs font-bold mb-1">📞 {addr.phone}</p>
                                          <p className="text-gray-500 text-xs leading-relaxed">{addr.street}, {addr.ward}, {addr.district}, {addr.city}</p>
                                          {addr.lat && addr.lng && (
                                            <p className="text-amber-600 text-[10px] font-bold mt-2">🗺️ Tọa độ: {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}</p>
                                          )}
                                      </div>
                                      <div className="flex items-start justify-end gap-2 md:w-32">
                                          <button onClick={() => handleOpenAddressModal(addr)} className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700">Sửa</button>
                                          <span className="text-gray-200">|</span>
                                          <button onClick={() => handleDeleteAddress(addr._id)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700">Xóa</button>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                    </div>
                  )}

                  <div className="pt-10 bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 mt-12">
                    <div className="flex items-center gap-4 text-amber-600 mb-2">
                      <span className="text-2xl">⚡</span>
                      <h4 className="text-xs font-black uppercase tracking-widest">Đặc quyền Thành viên</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Là thành viên của Petrolimex Fashion, bạn được hưởng các ưu đãi độc quyền: Miễn phí vận chuyển cho đơn từ 2 triệu, Ưu tiên hỗ trợ 24/7 và Hoàn tiền 2% cho mỗi đơn hàng thành công.</p>
                  </div>
                </div>
              )}

              {/* TAB: Security */}
              {activeTab === 'security' && (
                <div className="space-y-10">
                  <div className="border-b border-gray-50 pb-8">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Bảo Mật <span className="text-amber-500">Tài Khoản</span></h3>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Quản lý mật khẩu và các yếu tố an ninh</p>
                  </div>

                  <div className="max-w-md space-y-8">
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 rounded-[2.5rem] text-gray-900 shadow-xl shadow-amber-500/10">
                      <h4 className="font-black uppercase text-xs mb-3 italic">Khuyến nghị bảo mật</h4>
                      <p className="text-[11px] font-bold leading-relaxed opacity-90">Hãy thay đổi mật khẩu ít nhất 3 tháng một lần và sử dụng các ký tự đặc biệt để đảm bảo an toàn tối đa cho tài khoản của bạn.</p>
                    </div>

                    <div className="space-y-5">
                      {[
                        { label: 'Mật khẩu hiện tại', key: 'oldPassword' },
                        { label: 'Mật khẩu mới', key: 'newPassword' },
                        { label: 'Xác nhận mật khẩu mới', key: 'confirmPassword' }
                      ].map(field => (
                        <div key={field.key} className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{field.label}</label>
                          <input
                            type="password"
                            value={passwordForm[field.key]}
                            onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50/50 border-2 border-gray-100 focus:border-amber-500 outline-none font-bold transition-all shadow-inner text-sm"
                            placeholder="••••••••"
                          />
                        </div>
                      ))}
                      <button
                        onClick={handlePasswordChange}
                        disabled={isChangingPassword}
                        className="w-full bg-gray-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 hover:text-gray-900 transition-all shadow-2xl shadow-gray-300 mt-6 active:scale-95"
                      >
                        {isChangingPassword ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT MẬT KHẨU TÀI KHOẢN'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Seller Request */}
              {activeTab === 'seller' && (
                <div className="space-y-10">
                  <div className="border-b border-gray-50 pb-8">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Trở Thành <span className="text-amber-500">Đối Tác</span></h3>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Đăng ký gian hàng kinh doanh trên hệ thống</p>
                  </div>

                  {user.sellerRequest?.status === 'pending' ? (
                    <div className="bg-amber-50 p-12 rounded-[3rem] border border-amber-100 text-center py-24 shadow-inner">
                      <div className="text-7xl mb-8 animate-bounce">⏳</div>
                      <h4 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-3 italic">Yêu cầu đang được xác thực</h4>
                      <p className="text-sm text-gray-500 font-bold max-w-sm mx-auto leading-relaxed">Đội ngũ kiểm duyệt đang xem xét hồ sơ của bạn. Quy trình này thường mất từ 12-24 giờ làm việc.</p>
                    </div>
                  ) : (
                    <div className="bg-gray-900 text-white p-12 md:p-16 rounded-[4rem] relative overflow-hidden shadow-2xl group">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/20 blur-[100px] rounded-full -mr-40 -mt-40 group-hover:scale-125 transition-transform duration-1000"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full -ml-32 -mb-32"></div>

                      <div className="relative z-10 space-y-8">
                        <h4 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">Kiến tạo <br /> <span className="text-amber-500">Sự Thắng Lợi</span></h4>
                        <p className="text-gray-400 max-w-lg font-medium text-sm leading-relaxed">Gia nhập cộng đồng người bán cao cấp, nơi thương hiệu của bạn được nâng tầm với hệ sinh thái vận chuyển và marketing hàng đầu Việt Nam.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4">
                          {[
                            'Không phí đăng ký', 'Marketing đa kênh', 'Báo cáo doanh thu realtime', 'Hỗ trợ logistics 24/7'
                          ].map(benefit => (
                            <div key={benefit} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-amber-500/80">
                              <span className="w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center text-[8px] text-amber-500">✔</span>
                              {benefit}
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => setShowSellerModal(true)}
                          className="bg-amber-500 text-gray-900 px-12 py-6 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-2xl shadow-amber-500/20 hover:scale-105 active:scale-95 mt-4"
                        >
                          ĐĂNG KÝ GIAN HÀNG NGAY
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Seller Modal */}
      {showSellerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-7 md:p-10 shadow-2xl animate-scaleIn my-8 border border-gray-100 relative">
            <button onClick={() => setShowSellerModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-7 text-center">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">Đăng Ký <span className="text-amber-500">Người Bán</span></h3>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mt-1.5">Bắt đầu hành trình triệu đô của bạn</p>
            </div>

            {!showTerms ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Câu chuyện thương hiệu của bạn</label>
                  <textarea
                    rows="3"
                    value={sellerForm.reason}
                    onChange={(e) => setSellerForm({ ...sellerForm, reason: e.target.value })}
                    className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-gray-50 focus:border-amber-500 focus:bg-white transition-all outline-none font-medium shadow-inner text-sm leading-relaxed"
                    placeholder="Hãy chia sẻ kế hoạch kinh doanh và dòng sản phẩm định hướng của bạn..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Giấy tờ tùy thân hoặc GPKD (Ảnh chụp)</label>
                  <div
                    onClick={() => proofInputRef.current.click()}
                    className="w-full h-36 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-all group overflow-hidden relative shadow-inner"
                  >
                    {sellerForm.proofImage ? (
                      <>
                        <img src={`http://localhost:5000${sellerForm.proofImage}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">Thay đổi ảnh</div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-4xl mb-2 block group-hover:scale-125 transition-transform duration-500">📸</span>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest group-hover:text-amber-600 transition-colors">Tải ảnh chụp minh chứng tại đây</span>
                        <p className="text-[8px] text-gray-300 font-bold mt-1 uppercase">(Định dạng: JPG, PNG, tối đa 5MB)</p>
                      </div>
                    )}
                    <input type="file" ref={proofInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const formData = new FormData();
                        formData.append('image', e.target.files[0]);
                        Swal.fire({ title: 'Đang tải lên...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
                        const res = await api.post('/images/upload', formData);
                        setSellerForm({ ...sellerForm, proofImage: res.data.image.url });
                        Swal.close();
                      }
                    }} />
                  </div>
                </div>

                <button
                  onClick={() => setShowTerms(true)}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl shadow-gray-200"
                >
                  TIẾP TỤC BƯỚC CUỐI
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 h-72 overflow-y-auto custom-scrollbar shadow-inner">
                  <h4 className="font-black text-gray-900 uppercase tracking-tighter mb-6 text-sm italic border-b border-gray-200 pb-2">Điều khoản đối tác chiến lược</h4>
                  <div className="space-y-6 text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    <p className="flex gap-3"><span className="text-amber-500">01.</span> Cam kết tuyệt đối về chất lượng sản phẩm chính hãng hoặc tự thiết kế cao cấp.</p>
                    <p className="flex gap-3"><span className="text-amber-500">02.</span> Tuân thủ quy tắc đóng gói và bộ nhận diện thương hiệu Petrolimex Fashion.</p>
                    <p className="flex gap-3"><span className="text-amber-500">03.</span> Phối hợp vận hành theo đúng quy trình của sàn để đảm bảo trải nghiệm khách hàng.</p>
                    <p className="flex gap-3"><span className="text-amber-500">04.</span> Phí duy trì sàn cố định: 5% trên mỗi đơn hàng thành công.</p>
                    <p className="flex gap-3"><span className="text-amber-500">05.</span> Không được phép tự ý thu thập thông tin khách hàng cho mục đích ngoài sàn.</p>
                  </div>
                </div>

                <label className="flex items-center gap-5 cursor-pointer group px-4">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-7 h-7 rounded-xl border-2 border-gray-200 checked:bg-gray-900 checked:border-gray-900 appearance-none transition-all cursor-pointer"
                    />
                    {acceptedTerms && <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-black pointer-events-none">✓</span>}
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-gray-900 transition-colors tracking-widest leading-none">Tôi xác nhận đã thấu hiểu và đồng ý hoàn toàn</span>
                </label>

                <div className="flex gap-6">
                  <button onClick={() => setShowTerms(false)} className="flex-1 py-6 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-[10px] tracking-widest">QUAY LẠI</button>
                  <button onClick={handleSellerSubmit} disabled={!acceptedTerms} className="flex-1 py-6 bg-gray-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest disabled:opacity-20 shadow-2xl shadow-gray-200">GỬI HỒ SƠ DUYỆT</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-7 md:p-10 shadow-2xl animate-scaleIn border border-gray-100 relative max-h-[90vh] flex flex-col">
            <button onClick={() => setShowAddressModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="mb-6">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">{editingAddressId ? 'Cập Nhật' : 'Thêm'} <span className="text-amber-500">Địa Chỉ</span></h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col md:flex-row gap-8">
              {/* Form Lửa */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tên người nhận</label>
                    <input value={addressForm.receiverName} onChange={e => setAddressForm({...addressForm, receiverName: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-amber-500 outline-none font-bold text-sm transition-all" placeholder="Nhập tên người nhận" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Số điện thoại</label>
                    <input value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-amber-500 outline-none font-bold text-sm transition-all" placeholder="Nhập số điện thoại" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Thành phố/Tỉnh</label>
                        <input value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-amber-500 outline-none font-bold text-sm transition-all" placeholder="Tỉnh/Thành phố" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Quận/Huyện</label>
                        <input value={addressForm.district} onChange={e => setAddressForm({...addressForm, district: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-amber-500 outline-none font-bold text-sm transition-all" placeholder="Quận/Huyện" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Phường/Xã</label>
                    <input value={addressForm.ward} onChange={e => setAddressForm({...addressForm, ward: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-amber-500 outline-none font-bold text-sm transition-all" placeholder="Phường/Xã" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Địa chỉ cụ thể (Số nhà, Phố)</label>
                    <input value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-amber-500 outline-none font-bold text-sm transition-all" placeholder="Số nhà, Tên đường..." />
                </div>
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                    <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} className="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
                    <span className="text-xs font-bold text-gray-700">Đặt làm địa chỉ mặc định</span>
                </label>
              </div>

              {/* Bản đồ */}
              <div className="flex-1 min-h-[300px] border-2 border-gray-100 rounded-3xl overflow-hidden relative shadow-inner flex flex-col">
                <div className="bg-gray-50 p-3 border-b border-gray-100">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Ghim vị trí chính xác trên bản đồ</p>
                </div>
                <div className="flex-1 w-full bg-gray-100 relative">
                  {showAddressModal && (
                    <MapContainer center={mapPosition} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 10 }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                    </MapContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t border-gray-50 pt-6">
                <button onClick={() => setShowAddressModal(false)} className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all">HỦY BỎ</button>
                <button onClick={handleSaveAddress} disabled={isSavingAddress} className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-xl">
                    {isSavingAddress ? 'ĐANG LƯU...' : 'LƯU ĐỊA CHỈ NÀY'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl relative animate-scaleIn">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-900 italic">CÂN CHỈNH ẢNH DIỆN MẠO</h3>
              <button onClick={() => setShowCropper(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="relative h-[400px] bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-10 space-y-8 bg-white">
              <div className="px-4">
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-gray-900"
                />
                <div className="flex justify-between mt-2 text-[8px] font-black text-gray-300 uppercase tracking-widest">
                  <span>Thu nhỏ</span>
                  <span>Phóng to</span>
                </div>
              </div>
              <button
                onClick={handleApplyCrop}
                className="w-full py-6 bg-gray-900 text-amber-500 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-amber-500 hover:text-gray-900 transition-all shadow-2xl shadow-gray-200"
              >
                XÁC NHẬN DIỆN MẠO MỚI
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeInUp { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f9f9f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e2e2; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d1d1; }
      `}} />
    </div>
  );
}
