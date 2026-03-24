import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import Cropper from 'react-easy-crop';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Seller Request State
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sellerForm, setSellerForm] = useState({ reason: '', proofImage: '' });
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Change Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
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
    fetchProfile();
  }, [navigate]);

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
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/auth/me', form);
      setUser(res.data);
      setIsEditing(false);
      Swal.fire({
        icon: 'success',
        title: 'Tuyệt vời!',
        text: 'Cập nhật thông tin tài khoản thành công!',
        confirmButtonColor: '#f59e0b'
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: err.response?.data?.message || 'Không thể cập nhật hồ sơ!',
        confirmButtonColor: '#f59e0b'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result);
        setShowCropper(true);
      });
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
      Swal.fire({
        title: 'Đang tải lên...',
        didOpen: () => { Swal.showLoading(); }
      });

      const uploadRes = await api.post('/images/upload', formData);
      const imageUrl = uploadRes.data.image.url;

      const updateRes = await api.put('/auth/me', { avatar: imageUrl });
      setUser(updateRes.data);

      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Cập nhật ảnh đại diện thành công!',
        confirmButtonColor: '#f59e0b'
      });
    } catch (err) {
      console.error("Error uploading avatar:", err);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể xử lý ảnh!',
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  const handleProofChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image', file);

      Swal.fire({
        title: 'Đang tải lên...',
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        const uploadRes = await api.post('/images/upload', formData);
        setSellerForm({ ...sellerForm, proofImage: uploadRes.data.image.url });
        Swal.close();
      } catch (err) {
        Swal.fire("Lỗi", "Tải ảnh lên thất bại", "error");
      }
    }
  };

  const handleSellerSubmit = async () => {
    if (!sellerForm.reason || !sellerForm.proofImage) {
      Swal.fire("Lỗi", "Vui lòng nhập lý do và tải ảnh minh chứng", "warning");
      return;
    }
    if (!showTerms) {
      setShowTerms(true);
      return;
    }
    if (!acceptedTerms) {
      Swal.fire("Lỗi", "Bạn phải đồng ý với điều khoản", "warning");
      return;
    }

    try {
      const res = await api.post('/users/request-seller', {
        reason: sellerForm.reason,
        proofImage: sellerForm.proofImage
      });
      setUser(res.data.user);
      setShowSellerModal(false);
      setShowTerms(false);
      setAcceptedTerms(false);
      Swal.fire("Thành công", "Đã gửi yêu cầu", "success");
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi gửi yêu cầu", "error");
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      return Swal.fire("Lỗi", "Vui lòng nhập đầy đủ thông tin", "warning");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return Swal.fire("Lỗi", "Mật khẩu mới không khớp", "warning");
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      Swal.fire("Thành công", "Đã đổi mật khẩu", "success");
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Lỗi đổi mật khẩu", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* HEADER BAR */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-amber-500 transition font-black uppercase text-[10px] tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            QUAY LẠI TRANG CHỦ
          </button>
          <div className="text-xl font-black italic tracking-tighter text-gray-900">
            HỒ SƠ <span className="text-amber-500">CỦA TÔI</span>
          </div>
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 flex flex-col md:flex-row">

          {/* LEFT: AVATAR & QUICK INFO */}
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 p-12 text-center md:w-1/3 flex flex-col items-center justify-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 mix-blend-overlay bg-gradient-to-tr from-amber-500 to-transparent"></div>
            <div
              className="relative mb-6 cursor-pointer group"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={getFullUrl(user.avatar) || `https://ui-avatars.com/api/?name=${user.name}&background=f59e0b&color=fff&size=200`}
                className="w-32 h-32 rounded-full border-4 border-amber-500/30 p-1 bg-white object-cover shadow-2xl transition duration-500 group-hover:scale-105 group-hover:border-amber-500"
                alt="avatar"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center border-4 border-amber-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-gray-900 p-2 rounded-full border-2 border-gray-900 shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path></svg>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 select-none">{user.name}</h2>
            <div className="px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              {user.role} Account
            </div>
            <p className="text-gray-400 text-xs font-medium italic select-none">ID: #{user._id.slice(-8).toUpperCase()}</p>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="p-12 flex-1 space-y-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] border-b border-gray-100 pb-3 flex items-center justify-between">
                Thông tin cá nhân
                <span className="text-amber-500">Petrolimex Fashion</span>
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block">Họ và tên</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-gray-50 px-4 py-3 rounded-xl border-2 border-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition font-bold text-gray-800 shadow-inner"
                    />
                  ) : (
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 font-bold text-gray-800">{user.name}</div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block">Địa chỉ Email</label>
                  <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 font-bold text-gray-400 italic">{user.email} (Không thể chỉnh sửa)</div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block">Số điện thoại</label>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Nhập số điện thoại"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-gray-50 px-4 py-3 rounded-xl border-2 border-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition font-bold text-gray-800 shadow-inner"
                    />
                  ) : (
                    <div className={`bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 font-bold ${user.phone ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                      {user.phone || 'Chưa cập nhật'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block">Địa chỉ giao hàng</label>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Nhập địa chỉ nhận hàng"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full bg-gray-50 px-4 py-3 rounded-xl border-2 border-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition font-bold text-gray-800 shadow-inner"
                    />
                  ) : (
                    <div className={`bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 font-bold ${user.address ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                      {user.address || 'Chưa cập nhật'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-amber-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 text-[10px] transform active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setForm({ name: user.name, phone: user.phone || '', address: user.address || '' }); }}
                    className="px-8 bg-gray-100 text-gray-500 font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-gray-200 transition text-[10px]"
                  >
                    HUỶ
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-amber-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 text-[10px] transform active:scale-95"
                >
                  CHỈNH SỬA HỒ SƠ
                </button>
              )}

              {!isEditing && (
                <button
                  onClick={() => { localStorage.removeItem('token'); navigate('/'); window.location.reload(); }}
                  className="px-8 bg-red-50 text-red-500 font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-red-100 transition text-[10px]"
                >
                  ĐĂNG XUẤT
                </button>
              )}

              {!isEditing && (
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-8 bg-amber-50 text-amber-600 font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-amber-100 transition text-[10px]"
                >
                  ĐỔI MẬT KHẨU
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nâng Cấp Seller Section */}
        {user.role === 'user' && (
          <div className="mt-8 bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-amber-100 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Trở Thành Đối Tác Bán Hàng</h3>
              <p className="text-gray-500 text-sm">Mở gian hàng của riêng bạn và bắt đầu kinh doanh trên Petrolimex Fashion.</p>

              {user.sellerRequest?.status === "pending" && (
                <div className="mt-4 px-4 py-2 bg-amber-50 text-amber-700 font-bold text-sm border border-amber-200 rounded-lg inline-block">
                  Yêu cầu của bạn đang chờ phê duyệt.
                </div>
              )}
              {user.sellerRequest?.status === "rejected" && (
                <div className="mt-4 px-4 py-2 bg-red-50 text-red-700 font-bold text-sm border border-red-200 rounded-lg inline-block">
                  Yêu cầu của bạn bị từ chối. Lời nhắn: Vui lòng kiểm tra lại thông tin.
                </div>
              )}
            </div>
            {user.sellerRequest?.status !== "pending" && (
              <button
                onClick={() => setShowSellerModal(true)}
                className="bg-gray-900 text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-amber-500 hover:text-gray-900 shadow-xl transition"
              >
                Gửi Yêu Cầu
              </button>
            )}
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h3 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tighter border-b pb-4">Đổi Mật Khẩu</h3>

            <div className="space-y-4">
              {user.googleId && !user.password ? (
                <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 font-medium">
                  Tài khoản của bạn chưa có mật khẩu (đăng nhập bằng Google). Hãy thiết lập mật khẩu mới ngay!
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu cũ</label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={isChangingPassword}
                className="w-full bg-amber-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-amber-600 transition transform active:scale-95 disabled:opacity-50"
              >
                {isChangingPassword ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT MẬT KHẨU'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seller Request Modal */}
      {showSellerModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowSellerModal(false); setShowTerms(false); setAcceptedTerms(false); }}
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h3 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tighter border-b pb-4">Đăng Ký Làm Seller</h3>

            {!showTerms ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Lý do mở shop</label>
                  <textarea
                    rows="4"
                    value={sellerForm.reason}
                    onChange={(e) => setSellerForm({ ...sellerForm, reason: e.target.value })}
                    placeholder="Mô tả ngành hàng, quy mô và kinh nghiệm của bạn..."
                    className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:bg-white outline-none transition"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh minh chứng (CCCD, Giấy phép KD)</label>
                  <div
                    onClick={() => proofInputRef.current.click()}
                    className="w-full bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-amber-500 text-center cursor-pointer transition flex flex-col items-center gap-2"
                  >
                    {sellerForm.proofImage ? (
                      <img src={`http://localhost:5000${sellerForm.proofImage}`} className="h-32 object-contain rounded" />
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <span className="text-sm font-semibold text-gray-500">Tải ảnh lên tại đây</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={proofInputRef} className="hidden" accept="image/*" onChange={handleProofChange} />
                </div>
                <button
                  onClick={handleSellerSubmit}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl transition"
                >
                  Nâng Cấp
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 h-64 overflow-y-auto border border-gray-200">
                  <h4 className="font-black text-gray-800 mb-2">ĐIỀU KHOẢN TRỞ THÀNH NGƯỜI BÁN</h4>
                  <p className="mb-2">1. Cam kết hàng hóa chính hãng, không bán hàng giả, hàng nhái.</p>
                  <p className="mb-2">2. Tuân thủ quy định đóng gói và giao hàng của Petrolimex Fashion.</p>
                  <p className="mb-2">3. Mọi tranh chấp với khách hàng cần được giải quyết thỏa đáng trong 48 giờ.</p>
                  <p className="mb-2">4. Phí sàn áp dụng cho mỗi đơn hàng thành công là 5% tổng doanh thu.</p>
                  <p className="mb-2">5. Vi phạm nhiều lần sẽ bị khóa shop vĩnh viễn không cần báo trước.</p>
                  <p className="font-bold text-red-500 mt-4">Thông tin đăng ký của bạn sẽ được đội ngũ Admin xét duyệt trong 24-48 giờ.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 accent-amber-500"
                  />
                  <span className="text-sm font-bold text-gray-800">Tôi đã đọc và đồng ý với điều khoản</span>
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowTerms(false)}
                    className="flex-1 bg-gray-100 text-gray-600 font-black uppercase py-4 rounded-xl"
                  >
                    Quay Lại
                  </button>
                  <button
                    onClick={handleSellerSubmit}
                    disabled={!acceptedTerms}
                    className="flex-1 bg-amber-500 text-gray-900 font-black uppercase py-4 rounded-xl disabled:opacity-50"
                  >
                    Hoàn Tất Gửi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-white/20">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 italic">CẮT XÉN ẢNH ĐẠI DIỆN</h3>
              <button
                onClick={() => setShowCropper(false)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="relative h-96 bg-gray-900">
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

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block text-center">Phóng to / Thu nhỏ</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowCropper(false)}
                  className="flex-1 px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition"
                >
                  HUỶ BỎ
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-gray-900 transition shadow-xl"
                >
                  CẮT & LƯU ẢNH
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
