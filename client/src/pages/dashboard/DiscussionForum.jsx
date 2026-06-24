import React, { useEffect, useState } from "react";
import api from "../../services/api";
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Trash2,
  Edit,
  Pin,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Users,
  Flame,
  MessageCircle,
  CornerDownRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Loading from "../../components/Loading";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const DiscussionForum = () => {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [replyContent, setReplyContent] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: "", postId: null, replyId: null, message: "" });

  // FETCH POSTS
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/forum?page=${page}&limit=5&search=${search}`
      );
      setPosts(data?.posts || []);
      setTotalPages(data?.totalPages || 1);
    } catch (error) {
      console.error("Fetch error:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, search]);

  // CREATE / UPDATE
  const handleSubmitPost = async () => {
    if (!content.trim()) return;

    try {
      const formData = new FormData();
      formData.append("content", content);

      if (image) {
        formData.append("forumImage", image);
      }

      if (editingPost) {
        await api.put(`/forum/${editingPost}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setEditingPost(null);
      } else {
        await api.post("/forum", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setContent("");
      setImage(null);
      setPreview(null);
      setShowForm(false);
      fetchPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const likePost = async (id) => {
    await api.post(`/forum/${id}/like`);
    fetchPosts();
  };

  const deletePost = (id) => {
    setConfirmConfig({ 
      isOpen: true, 
      type: "post", 
      postId: id, 
      message: "Are you sure you want to delete this discussion topic?" 
    });
  };

  const confirmDelete = async () => {
    const { type, postId, replyId } = confirmConfig;
    if (type === "post") {
      await api.delete(`/forum/${postId}`);
    } else if (type === "reply") {
      await api.delete(`/forum/${postId}/reply/${replyId}`);
    }
    setConfirmConfig({ isOpen: false, type: "", postId: null, replyId: null, message: "" });
    fetchPosts();
  };

  const pinPost = async (id) => {
    await api.put(`/forum/${id}/pin`);
    fetchPosts();
  };

  const addReply = async (postId) => {
    if (!replyContent[postId]?.trim()) return;
    await api.post(`/forum/${postId}/reply`, {
      content: replyContent[postId],
    });
    setReplyContent((prev) => ({ ...prev, [postId]: "" }));
    fetchPosts();
  };

  const deleteReply = (postId, replyId) => {
    setConfirmConfig({ 
      isOpen: true, 
      type: "reply", 
      postId, 
      replyId, 
      message: "Are you sure you want to delete this reply?" 
    });
  };

  const toggleReplies = (postId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Stats
  const pinnedCount = posts.filter(p => p.isPinned).length;
  const popularCount = posts.filter(p => (p.likes?.length || 0) > 5).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in duration-700 min-h-screen">
      
      {/* HEADER HERO */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-xs font-black uppercase tracking-widest border border-violet-500/30">
              <Users size={14} /> Community Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Discussion <span className="text-violet-400">Forum</span>
            </h1>
            <p className="text-slate-400 max-w-lg text-lg">
              Engage with peers, share insights, ask questions, and collaborate with the academy community.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
            <StatCard 
              icon={<MessageCircle size={20} />} 
              label="Active Topics" 
              value={posts.length} 
              color="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
            />
            <StatCard 
              icon={<Flame size={20} />} 
              label="Hot Topics" 
              value={popularCount} 
              color={popularCount > 0 ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-slate-800 text-slate-400 border-slate-700"} 
            />
            <StatCard 
              icon={<Pin size={20} />} 
              label="Pinned" 
              value={pinnedCount} 
              color="bg-amber-500/20 text-amber-400 border-amber-500/30 col-span-2 md:col-span-1" 
            />
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-600/10 blur-[80px] rounded-full -ml-20 -mb-20 pointer-events-none" />
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative flex flex-col w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search discussions..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-600/10 focus:border-violet-600 transition-all shadow-sm text-sm font-semibold text-slate-800"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setEditingPost(null);
            setContent("");
            setImage(null);
            setPreview(null);
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 active:scale-95"
        >
          <MessageSquare size={18} /> Start a Discussion
        </button>
      </div>

      {/* BODY */}
      <div className="space-y-6">
        {/* LOADING */}
        {loading && posts.length === 0 && (
          <div className="py-24 flex justify-center">
            <Loading message="Syncing with the community network..." />
          </div>
        )}

        {/* NO POSTS */}
        {!loading && posts.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Quiet in here...</h3>
            <p className="text-slate-500 mt-2">No discussions found. Be the first to spark a conversation!</p>
          </div>
        )}

        {/* POSTS */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post._id}
              className={`bg-white rounded-[2rem] p-6 sm:p-8 flex flex-col transition-all duration-300 ${post.isPinned ? "border-2 border-amber-300 shadow-md shadow-amber-500/5 bg-gradient-to-br from-amber-50/30 to-white" : "border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1"}`}
            >
              {/* POST HEADER */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  {/* Avatar Placeholder */}
                  <div className="w-12 h-12 rounded-full bg-violet-100 border-2 border-white shadow-sm flex items-center justify-center text-violet-600 font-bold text-lg">
                    {post.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-lg">{post.name}</h3>
                      {post.isPinned && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {post.role}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  {user?.role === "admin" && (
                    <button
                      className={`p-2 rounded-xl transition-colors ${post.isPinned ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"}`}
                      onClick={() => pinPost(post._id)}
                      title={post.isPinned ? "Unpin Post" : "Pin Post"}
                    >
                      <Pin size={16} fill={post.isPinned ? "currentColor" : "none"} />
                    </button>
                  )}

                  {(user?._id === post.user || user?.role === "admin") && (
                    <>
                      <button
                        className="p-2 bg-slate-100 text-indigo-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        onClick={() => {
                          setEditingPost(post._id);
                          setContent(post.content);
                          setShowForm(true);
                        }}
                        title="Edit Post"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-2 bg-slate-100 text-red-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                        onClick={() => deletePost(post._id)}
                        title="Delete Post"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* POST CONTENT */}
              <p className="mt-2 text-slate-700 leading-relaxed text-base min-h-[40px]">
                {post.content}
              </p>

              {/* POST IMAGE */}
              {post.image && (
                <div className="mt-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-h-[500px]">
                  <img
                    src={post.image}
                    alt="attachment"
                    className="w-full h-full object-cover rounded-2xl transition-transform hover:scale-105 duration-700"
                  />
                </div>
              )}

              {/* POST ACTIONS */}
              <div className="flex flex-wrap items-center gap-4 mt-8 pt-4 border-t border-slate-100/80">
                <button
                  onClick={() => likePost(post._id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 font-bold text-sm bg-slate-50 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                >
                  <ThumbsUp size={16} />
                  {post.likes?.length || 0} Likes
                </button>

                <button
                  onClick={() => toggleReplies(post._id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${expandedReplies[post._id] ? "bg-violet-50 text-violet-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  <MessageCircle size={16} />
                  {post.replies?.length || 0} Replies
                  {expandedReplies[post._id] ? <ChevronUp size={14} className="ml-1 opacity-50" /> : <ChevronDown size={14} className="ml-1 opacity-50" />}
                </button>
              </div>

              {/* REPLIES SECTION */}
              {expandedReplies[post._id] && (
                <div className="mt-6 space-y-4 pl-4 sm:pl-10 border-l-2 border-slate-100">
                  {post.replies?.map((reply) => (
                    <div
                      key={reply._id}
                      className="bg-slate-50 p-4 sm:p-5 rounded-2xl relative group"
                    >
                      <CornerDownRight size={16} className="absolute -left-6 top-5 text-slate-300" />
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                             {reply.name?.charAt(0).toUpperCase()}
                           </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm">
                              {reply.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider ml-2">
                              {reply.role}
                            </span>
                          </div>
                        </div>

                        {(user?._id === reply.user || user?.role === "admin") && (
                          <button
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => deleteReply(post._id, reply._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 pl-11">{reply.content}</p>
                    </div>
                  ))}

                  {/* ADD REPLY FORM */}
                  <div className="flex gap-3 mt-4 pt-2 relative">
                     <CornerDownRight size={16} className="absolute -left-6 top-5 text-slate-300 hidden sm:block" />
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-violet-600/10 focus:border-violet-600 transition-all font-medium"
                      value={replyContent[post._id] || ""}
                      onChange={(e) =>
                        setReplyContent((prev) => ({
                          ...prev,
                          [post._id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addReply(post._id);
                      }}
                    />
                    <button
                      onClick={() => addReply(post._id)}
                      className="bg-violet-600 text-white px-5 rounded-xl font-bold hover:bg-violet-700 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                    >
                      <Send size={14} /> <span className="hidden sm:inline">Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12 bg-white inline-flex mx-auto rounded-xl p-1 shadow-sm border border-slate-100">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 font-bold text-sm rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 font-black text-sm text-violet-600 bg-violet-50 rounded-lg">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 font-bold text-sm rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* DISPATCH MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden scale-in-center flex flex-col">
            
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-8 text-white relative flex-shrink-0">
               <button 
                 onClick={() => {
                   setShowForm(false);
                   setImage(null);
                   setPreview(null);
                 }}
                 className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
               >
                 <X size={20} />
               </button>
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                 <MessageSquare size={24} className="text-white" />
               </div>
               <h2 className="text-2xl font-black tracking-tight mb-1">
                 {editingPost ? "Edit Discussion" : "Start a Discussion"}
               </h2>
               <p className="text-violet-200 text-sm">Contribute to the academy knowledge base</p>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 pl-1">
                  Share Your Thoughts
                </label>
                <textarea
                  rows="5"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-600/10 focus:border-violet-600 transition-all font-medium text-slate-800 placeholder:text-slate-400 resize-none"
                  placeholder="What's on your mind? Ask a question or share insights..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* IMAGE UPLOAD */}
              <div>
                 <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 pl-1">
                    Attach Image (Optional)
                 </label>
                 {!preview ? (
                   <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors cursor-pointer group">
                     <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-violet-600">
                       <ImageIcon size={24} />
                       <span className="text-sm font-bold">Click to upload image</span>
                     </div>
                     <input
                       type="file"
                       className="hidden"
                       accept="image/*"
                       onChange={(e) => {
                         const file = e.target.files[0];
                         if (file) {
                           setImage(file);
                           setPreview(URL.createObjectURL(file));
                         }
                       }}
                     />
                   </label>
                 ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm inline-block">
                      <img
                        src={preview}
                        alt="preview"
                        className="max-h-48 object-cover"
                      />
                      <button
                        onClick={() => {
                          setImage(null);
                          setPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-slate-900/60 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm"
                        title="Remove Image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                 )}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end sticky bottom-0 rounded-b-[2rem]">
              <button
                onClick={() => {
                  setShowForm(false);
                  setImage(null);
                  setPreview(null);
                }}
                className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitPost}
                className="px-8 py-3 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 active:scale-95 transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2"
              >
                {editingPost ? "Update Post" : "Post to Forum"} <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.type === "post" ? "Delete Discussion" : "Delete Reply"}
        message={confirmConfig.message}
        confirmText="Confirm Delete"
        onConfirm={confirmDelete}
        onClose={() => setConfirmConfig({ isOpen: false, type: "", postId: null, replyId: null, message: "" })}
        type="danger"
      />
    </div>
  );
};

// Extracted Component for Header Stats
const StatCard = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-2xl border flex flex-col justify-center gap-1 ${color} backdrop-blur-md`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="opacity-80">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</span>
    </div>
    <span className="text-2xl font-black">{value}</span>
  </div>
);

export default DiscussionForum;