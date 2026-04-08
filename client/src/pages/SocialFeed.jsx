import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';
import { useTranslation } from "react-i18next";
import AutoText from '../components/AutoText';

export default function SocialFeed() {
  const { user } = useCart();
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', images: [] });
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles([...imageFiles, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;
    setIsSubmitting(true);

    try {
      const uploadedImageUrls = [];
      
      // Upload images first
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImageUrls.push(res.data.image.url);
      }

      await api.post('/posts', {
        content: newPost.content,
        images: uploadedImageUrls
      });

      Swal.fire({
        icon: 'success',
        title: 'Đã đăng bài!',
        text: 'Bài viết của bạn đang chờ Admin phê duyệt.',
        confirmButtonColor: '#f59e0b'
      });

      setShowCreateModal(false);
      setNewPost({ content: '', images: [] });
      setImageFiles([]);
      setPreviews([]);
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể tạo bài viết', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePostLocally = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p));
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] pt-36 pb-10">
      <Navbar />
      
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Page Header */}
        <div className="flex flex-col items-center mb-10 text-center">
            <h1 className="text-4xl font-black text-gray-900 mb-2 italic tracking-tighter">
                <span className="text-amber-500">PETROLIMEX</span> SOCIAL
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">
                Nhật ký Styles & Fashion Feed
            </p>
        </div>

        {/* Create Post Entry */}
        {user && (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 mb-8 flex items-center gap-4 cursor-pointer hover:shadow-2xl transition-all border border-gray-100 group"
               onClick={() => setShowCreateModal(true)}>
             <img
              src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : `https://ui-avatars.com/api/?name=${user.name}&background=f59e0b&color=fff`}
              className="w-12 h-12 rounded-full border border-amber-500/30 object-cover"
              alt="avatar"
            />
            <div className="flex-1 bg-gray-50 rounded-full px-6 py-3 text-gray-400 font-medium group-hover:bg-gray-100 transition-colors">
               <AutoText text="Hôm nay bạn mặc gì? Chia sẻ ngay..." />
            </div>
            <div className="bg-amber-500 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </div>
          </div>
        )}

        {/* Feed List */}
        {loading ? (
          <div className="flex justify-center flex-col items-center py-20 gap-4">
             <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest animate-pulse">Đang tải Styles...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  user={user} 
                  onUpdate={updatePostLocally} 
                />
              ))
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
                  <div className="text-4xl mb-4 opacity-30">📰</div>
                  <h3 className="font-black text-gray-900 uppercase">Chưa có bài viết nào</h3>
                  <p className="text-gray-400 text-sm mt-1">Hãy là người đầu tiên chia sẻ phong cách của bạn!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative my-auto animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight italic">
              <span className="text-amber-500">Đăng</span> bài viết mới
            </h2>

            <form onSubmit={handleCreatePost} className="space-y-6">
               <div>
                  <textarea
                    rows="4"
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    className="w-full bg-gray-50 rounded-2xl p-5 border border-gray-100 focus:bg-white focus:border-amber-500 transition-all outline-none font-medium text-gray-800 placeholder:text-gray-300"
                    placeholder="Mô tả phong cách của bạn, các hashtag #ootd #fashion..."
                    required
                  ></textarea>

                  {/* Emoji Strip for Post */}
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar">
                    {['✨', '😍', '🔥', '👗', '👠', '📸', '💖', '🧥', '👖', '👔', '👑'].map(emoji => (
                      <button key={emoji} type="button" onClick={() => setNewPost(prev => ({...prev, content: prev.content + emoji}))} className="hover:scale-125 transition-transform text-lg">{emoji}</button>
                    ))}
                  </div>
               </div>

               {/* Image Upload Area */}
               <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 ml-1">Hình ảnh phối đồ</label>
                  <div className="grid grid-cols-3 gap-3">
                     {previews.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                           <img src={src} className="w-full h-full object-cover" alt="preview" />
                           <button 
                             type="button"
                             onClick={() => removeImage(idx)}
                             className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                 <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                           </button>
                        </div>
                     ))}
                     {previews.length < 5 && (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-amber-500/50 transition-all text-gray-300">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                           </svg>
                           <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                     )}
                  </div>
               </div>

               <button
                 type="submit"
                 disabled={isSubmitting || !newPost.content.trim()}
                 className={`w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest transition-all shadow-xl ${isSubmitting ? 'bg-gray-300' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 active:scale-95'}`}
               >
                 {isSubmitting ? 'Đang đăng tải...' : 'Đăng bài ngay'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
