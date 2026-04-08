import React, { useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useTranslation } from "react-i18next";
import AutoText from './AutoText';

export default function PostCard({ post, user, onUpdate }) {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id: string, name: string }
  const [expandedComments, setExpandedComments] = useState([]); // IDs of top-level comments with visible replies

  const fashionEmojis = ['✨', '😍', '🔥', '👗', '👠', '📸', '💖', '🧥', '👖', '👔', '👑'];

  // Check if current user liked/disliked
  const isLiked = post.likes?.includes(user?._id);
  const isDisliked = post.dislikes?.includes(user?._id);

  const handleLike = async () => {
    if (!user) return Swal.fire(t('at_login_required'), t('please_login_to_like'), 'info');
    try {
      const res = await api.put(`/posts/${post._id}/like`);
      onUpdate(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDislike = async () => {
    if (!user) return Swal.fire(t('at_login_required'), t('please_login_to_dislike'), 'info');
    try {
      const res = await api.put(`/posts/${post._id}/dislike`);
      onUpdate(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchComments = async () => {
    if (showComments && !replyTo) {
      setShowComments(false);
      return;
    }
    setLoadingComments(true);
    try {
      const res = await api.get(`/comments/${post._id}`);
      setComments(res.data);
      setShowComments(true);
    } catch (err) { console.error(err); }
    finally { setLoadingComments(false); }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!user) return Swal.fire(t('at_login_required'), t('please_login_to_comment'), 'info');
    if (!comment.trim()) return;

    try {
      const parentId = replyTo?.parentId || replyTo?.id || null;
      const res = await api.post('/comments', { 
        postId: post._id, 
        content: comment,
        parentCommentId: parentId
      });
      setComments([...comments, res.data]);
      setComment("");
      setReplyTo(null);
      // Auto expand parent if it's a top-level reply
      if (parentId) {
        setExpandedComments(prev => [...new Set([...prev, parentId])]);
      }
      onUpdate({ ...post, commentCount: (post.commentCount || 0) + 1 });
    } catch (err) { console.error(err); }
  };

  const handleCommentVote = async (commentId, type) => {
    if (!user) return Swal.fire(t('at_login_required'), 'Vui lòng đăng nhập để bình chọn', 'info');
    try {
      const res = await api.put(`/comments/${commentId}/${type}`);
      setComments(comments.map(c => c._id === commentId ? { ...c, ...res.data } : c));
    } catch (err) { console.error(err); }
  };

  const addEmoji = (emoji) => setComment(prev => prev + emoji);

  const startReply = (c, parentId = null) => {
    const targetName = c.user?.name || 'User';
    setReplyTo({ id: c._id, name: targetName, parentId: parentId || c._id });
    setComment(`@${targetName} `);
    setShowComments(true);
    // Focus input
    setTimeout(() => {
       const input = document.getElementById(`comment-input-${post._id}`);
       if (input) input.focus();
    }, 100);
  };

  const toggleExpand = (compId) => {
    setExpandedComments(prev => 
      prev.includes(compId) ? prev.filter(id => id !== compId) : [...prev, compId]
    );
  };

  // Helper to render comment & its replies
  const renderComment = (c, isReply = false, parentId = null) => {
    const userLiked = c.likes?.includes(user?._id);
    const userDisliked = c.dislikes?.includes(user?._id);
    const children = comments.filter(r => r.parentComment === c._id);
    const isExpanded = expandedComments.includes(c._id);

    return (
      <div key={c._id} className={`${isReply ? 'ml-10 mt-3 border-l-2 border-gray-100 pl-4' : 'mb-6'}`}>
        <div className="flex gap-3 group">
          <img
            src={c.user?.avatar ? (c.user.avatar.startsWith('http') ? c.user.avatar : `http://localhost:5000${c.user.avatar}`) : `https://ui-avatars.com/api/?name=${c.user?.name || 'User'}&background=f59e0b&color=fff`}
            className="w-8 h-8 rounded-full border border-gray-100 object-cover flex-shrink-0"
            alt="avatar"
          />
          <div className="flex-1">
             <div className="bg-gray-50 rounded-2xl p-3 inline-block min-w-[120px] group-hover:bg-gray-100/50 transition-colors">
                <span className="text-[10px] font-black text-gray-900 block">{c.user?.name}</span>
                <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{c.content}</p>
             </div>
             
             <div className="flex items-center gap-4 mt-1 ml-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <button onClick={() => handleCommentVote(c._id, 'like')} className={`${userLiked ? 'text-amber-500' : 'hover:text-amber-500'} transition-colors`}>Thích ({c.likes?.length || 0})</button>
                <button onClick={() => handleCommentVote(c._id, 'dislike')} className={`${userDisliked ? 'text-red-500' : 'hover:text-red-500'} transition-colors`}>Ghét ({c.dislikes?.length || 0})</button>
                <button onClick={() => startReply(c, parentId)} className="hover:text-blue-500 transition-colors">Phản hồi</button>
             </div>

             {/* Expand/Collapse Toggle for top-level only */}
             {!isReply && children.length > 0 && (
                <button 
                  onClick={() => toggleExpand(c._id)}
                  className="mt-2 text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-amber-50 px-2 py-1 rounded-full transition-all"
                >
                  <span className="w-6 h-[1.5px] bg-amber-200"></span>
                  {isExpanded ? "Thu gọn" : `Xem ${children.length} câu trả lời`}
                </button>
             )}
          </div>
        </div>
        {/* Render children only if expanded or if it's already a nested reply block */}
        {((!isReply && isExpanded) || isReply) && children.map(r => renderComment(r, true, c._id))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <img
            src={post.user?.avatar ? (post.user.avatar.startsWith('http') ? post.user.avatar : `http://localhost:5000${post.user.avatar}`) : `https://ui-avatars.com/api/?name=${post.user?.name || 'User'}&background=f59e0b&color=fff`}
            className="w-10 h-10 rounded-full border border-amber-500/30 object-cover"
            alt="avatar"
            />
            <div>
            <h4 className="font-black text-gray-900 text-sm">{post.user?.name}</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {new Date(post.createdAt).toLocaleDateString()}
            </p>
            </div>
        </div>
        <div className="bg-gray-50 px-3 py-1 rounded-full text-[9px] font-black text-amber-600 uppercase tracking-widest border border-amber-100">
            PETROLIMEX FASHION
        </div>
      </div>

      {/* Images Carousel */}
      <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-y border-gray-50">
        {post.images && post.images.length > 0 ? (
          <img
            src={post.images[0].startsWith('http') ? post.images[0] : `http://localhost:5000${post.images[0]}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            alt="post content"
          />
        ) : (
          <div className="text-gray-200 text-4xl">🖼️</div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-8">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2.5 transition-all hover:scale-110 ${isLiked ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.708a2 2 0 011.977 2.304l-1.5 8A2 2 0 0117.208 22H4V10L10 2l1 1v7h3z" />
              </svg>
              <span className="text-[11px] font-black">{post.likes?.length || 0}</span>
            </button>

            <button
              onClick={handleDislike}
              className={`flex items-center gap-2.5 transition-all hover:scale-110 ${isDisliked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDisliked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14H5.292a2 2 0 01-1.977-2.304l1.5-8A2 2 0 016.792 2H20v12l-6 8-1-1v-7h-3z" />
              </svg>
              <span className="text-[11px] font-black">{post.dislikes?.length || 0}</span>
            </button>

            <button
              onClick={fetchComments}
              className="flex items-center gap-2.5 text-gray-400 hover:text-blue-500 transition-all hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-[11px] font-black">{post.commentCount || 0}</span>
            </button>
          </div>
          
          <button className="text-gray-300 hover:text-gray-600 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
             </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-gray-800 leading-relaxed font-medium">
             <span className="font-black mr-2">{post.user?.name}</span>
             {post.content}
          </p>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-8 border-t border-gray-50 pt-6 animate-in slide-in-from-top-4 duration-500">
            {comments.filter(c => !c.parentComment).map(c => renderComment(c))}
            {loadingComments && <div className="text-center py-4 text-[10px] font-black text-amber-500 animate-pulse uppercase tracking-widest">Đang tải hội thoại...</div>}
            {comments.length === 0 && !loadingComments && <p className="text-center text-[10px] text-gray-400 font-bold uppercase py-4 tracking-widest">Hãy là người đầu tiên bình luận ✨</p>}
          </div>
        )}

        {/* Reply Tag */}
        {replyTo && (
           <div className="flex items-center justify-between bg-amber-50 px-4 py-2 rounded-t-xl border-x border-t border-amber-100 animate-in slide-in-from-bottom-2">
              <span className="text-[10px] font-bold text-amber-700">Đang trả lời <span className="font-black">{replyTo.name}</span></span>
              <button onClick={() => setReplyTo(null)} className="text-amber-800 hover:text-red-500 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                 </svg>
              </button>
           </div>
        )}

        {/* Add Comment Input & Emojis */}
        <div className="mt-4">
           {/* Quick Emoji Strip */}
           <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
              {fashionEmojis.map(emoji => (
                 <button key={emoji} onClick={() => addEmoji(emoji)} className="hover:scale-125 transition-transform text-lg">{emoji}</button>
              ))}
           </div>
           
           <form onSubmit={submitComment} className="flex gap-3">
              <input
                id={`comment-input-${post._id}`}
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={replyTo ? "Viết phản hồi..." : "Viết lời khen..."}
                className={`flex-1 bg-gray-50 border border-gray-100 ${replyTo ? 'rounded-b-2xl' : 'rounded-full'} px-5 py-3 text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium shadow-inner`}
              />
              <button
                type="submit"
                disabled={!comment.trim()}
                className="bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
           </form>
        </div>
      </div>
    </div>
  );
}
