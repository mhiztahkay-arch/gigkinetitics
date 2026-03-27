import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, TrendingUp, Star, MapPin, Clock, Plus, Share2, MessageCircle, Twitter, Facebook, Linkedin, Instagram, Youtube, Send, Globe, Smartphone, Package, ChevronRight, Users, Heart, MessageSquare, Image as ImageIcon, Video, MoreHorizontal, Bot, Zap, UserPlus, UserMinus, MessageSquarePlus, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Walkthrough from '../components/Walkthrough';
import { useTheme } from '../lib/ThemeContext';
import { format } from 'date-fns';
import { uploadFile } from '../lib/upload';

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_role: string;
  content: string;
  image_url?: string;
  likes: number;
  created_at: string;
  is_liked?: boolean;
  is_following?: boolean;
}

export default function Dashboard({ user }: { user: any }) {
  const { theme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ activeGigs: 0, balance: 0, followers: 0, following: 0 });
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [interpreting, setInterpreting] = useState<string | null>(null);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem('hasSeenWalkthrough');
    if (!hasSeenWalkthrough) {
      setShowWalkthrough(true);
    }

    fetchPosts();
    fetchStats();
  }, [user.id]);

  const handleInterpret = async (postId: string, text: string) => {
    setInterpreting(postId);
    try {
      const res = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: user.preferred_language,
          targetStyle: user.comm_style
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, content: data.text } : p));
      }
    } catch (error) {
      console.error('Interpretation failed', error);
    } finally {
      setInterpreting(null);
    }
  };

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  };

  const fetchStats = async () => {
    const [statsRes, connRes] = await Promise.all([
      fetch(`/api/stats/${user.id}`),
      fetch(`/api/connections/${user.id}`)
    ]);
    const statsData = await statsRes.json();
    const connData = await connRes.json();
    setStats({ ...statsData, ...connData });
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !postImage) return;
    setIsPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id, 
          content: newPostContent,
          image_url: postImage
        })
      });
      if (res.ok) {
        setNewPostContent('');
        setPostImage(null);
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to create post', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, user_id: user.id })
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to like post', error);
    }
  };

  const handleFollow = async (followingId: string, isFollowing: boolean) => {
    const endpoint = isFollowing ? '/api/connections/unfollow' : '/api/connections/follow';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: user.id, following_id: followingId })
      });
      if (res.ok) {
        fetchPosts();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to follow/unfollow', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    try {
      const res = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, user_id: user.id, content: commentInput })
      });
      if (res.ok) {
        setCommentInput('');
        setCommentingOn(null);
        alert("Comment added sharp sharp!");
      }
    } catch (error) {
      console.error('Failed to comment', error);
    }
  };

  const handleWalkthroughComplete = () => {
    localStorage.setItem('hasSeenWalkthrough', 'true');
    setShowWalkthrough(false);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24">
      <AnimatePresence>
        {showWalkthrough && <Walkthrough onComplete={handleWalkthroughComplete} />}
      </AnimatePresence>

      {/* Welcome & Profile Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className={`lg:col-span-2 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border shadow-2xl relative overflow-hidden group transition-colors ${
          theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[20px] sm:rounded-[32px] overflow-hidden border-4 border-black shadow-2xl bg-neutral-900">
              <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 border-4 border-black rounded-full" />
          </div>
          <div className="text-center sm:text-left space-y-1 sm:space-y-2 relative">
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>How far, {user.name.split(' ')[0]}? 👋</h2>
            <p className="text-neutral-500 text-xs sm:text-sm font-medium">You have <span className="text-emerald-500 font-bold">{stats.activeGigs} active gigs</span> running sharp sharp.</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 pt-1 sm:pt-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-neutral-50 border-neutral-100 shadow-sm'
              }`}>
                <Users size={16} className="text-blue-400" />
                <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-700'}`}>{stats.followers} Followers</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-neutral-50 border-neutral-100 shadow-sm'
              }`}>
                <Users size={16} className="text-purple-400" />
                <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-700'}`}>{stats.following} Following</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-center items-center gap-1 sm:gap-2 border shadow-2xl bg-gradient-to-br from-emerald-600/20 to-blue-600/20 ${
          theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
        }`}>
          <p className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-widest">Available Balance</p>
          <h3 className={`text-3xl sm:text-4xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>₦{stats.balance.toLocaleString()}</h3>
          <button className="mt-2 sm:mt-4 w-full py-2.5 sm:py-3 bg-emerald-600 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
            Withdraw Funds
          </button>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction to="/post-job" icon={<Plus size={24} />} label="Post Job" color="bg-emerald-600" />
        <QuickAction to="/market" icon={<Package size={24} />} label="Marketplace" color="bg-blue-600" />
        <QuickAction to="/talent" icon={<Users size={24} />} label="Find Talent" color="bg-purple-600" />
        <QuickAction to="/ai" icon={<Bot size={24} />} label="AI Assistant" color="bg-amber-600" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          {/* Create Post */}
          <section className={`rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 border shadow-xl ${
            theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
          }`}>
            <div className="flex gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden shrink-0">
                <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-3 sm:space-y-4">
                <textarea 
                  placeholder="What's on your professional mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className={`w-full border rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none min-h-[80px] sm:min-h-[100px] ${
                    theme === 'dark' ? 'bg-neutral-900/50 border-white/5 text-white' : 'bg-neutral-50 border-neutral-100 text-neutral-900'
                  }`}
                />

                {postImage && (
                  <div className="relative w-full max-h-60 rounded-2xl overflow-hidden border border-white/10">
                    <img src={postImage} className="w-full h-full object-cover" alt="preview" />
                    <button 
                      onClick={() => setPostImage(null)}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5 sm:gap-2">
                    <label className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-colors cursor-pointer ${
                      theme === 'dark' ? 'glass text-neutral-400 hover:text-emerald-500' : 'bg-neutral-100 text-neutral-500 hover:text-emerald-600'
                    }`}>
                      <ImageIcon size={18} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          try {
                            const url = await uploadFile(file);
                            setPostImage(url);
                          } catch (error) {
                            alert('Upload failed');
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                      />
                    </label>
                    <button className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-colors ${
                      theme === 'dark' ? 'glass text-neutral-400 hover:text-blue-500' : 'bg-neutral-100 text-neutral-500 hover:text-blue-600'
                    }`}>
                      <Video size={18} />
                    </button>
                  </div>
                  <button 
                    onClick={handleCreatePost}
                    disabled={(!newPostContent.trim() && !postImage) || isPosting || isUploading}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm disabled:opacity-50 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                  >
                    {isPosting ? 'Posting...' : 'Post Sharp Sharp'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Feed */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Professional Feed</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="text" 
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'glass border-white/5 text-white w-40 sm:w-60' : 'bg-neutral-100 border-neutral-200 text-neutral-900 w-full'
                    }`}
                  />
                </div>
                <button className="text-xs font-bold text-neutral-500 uppercase tracking-widest hover:text-emerald-500 transition-colors">Latest First</button>
              </div>
            </div>
            
            <div className="space-y-6">
              {posts.filter(p => 
                (p.content?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                (p.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
              ).map((post) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-[32px] p-6 border shadow-lg space-y-4 transition-all ${
                    theme === 'dark' ? 'glass border-white/5 hover:border-white/10' : 'bg-white border-neutral-200 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Link to={`/user/${post.user_id}`} className="flex items-center gap-3 group">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform">
                        <img src={post.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_name}`} alt="avatar" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm group-hover:text-emerald-500 transition-colors ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{post.user_name}</h4>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{post.user_role}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      {post.user_id !== user.id && (
                        <button 
                          onClick={() => handleFollow(post.user_id, !!post.is_following)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            post.is_following 
                              ? (theme === 'dark' ? 'glass text-neutral-400' : 'bg-neutral-100 text-neutral-500')
                              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                          }`}
                        >
                          {post.is_following ? <UserMinus size={14} /> : <UserPlus size={14} />}
                          {post.is_following ? 'Following' : 'Follow'}
                        </button>
                      )}
                      <button className="p-2 text-neutral-500 hover:text-emerald-500 transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>{post.content}</p>
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleInterpret(post.id, post.content)}
                      disabled={interpreting === post.id}
                      className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:underline disabled:opacity-50"
                    >
                      {interpreting === post.id ? 'Interpreting...' : 'Interpret (AI)'}
                    </button>
                  </div>
                  
                  {post.image_url && (
                    <div className={`rounded-2xl overflow-hidden border ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                      <img src={post.image_url} className="w-full h-auto max-h-96 object-cover" alt="post" />
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-6 pt-2 border-t ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors group ${post.is_liked ? 'text-emerald-500' : 'text-neutral-500 hover:text-emerald-500'}`}
                    >
                      <Heart size={18} className={post.is_liked ? 'fill-emerald-500' : 'group-hover:fill-emerald-500'} />
                      <span className="text-xs font-bold">{post.likes}</span>
                    </button>
                    <button 
                      onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                      className={`flex items-center gap-2 transition-colors ${commentingOn === post.id ? 'text-blue-500' : 'text-neutral-500 hover:text-blue-500'}`}
                    >
                      <MessageSquare size={18} />
                      <span className="text-xs font-bold">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 text-neutral-500 hover:text-purple-500 transition-colors">
                      <Share2 size={18} />
                      <span className="text-xs font-bold">Share</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {commentingOn === post.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 space-y-4 overflow-hidden"
                      >
                        <div className="flex gap-3">
                          <input 
                            type="text"
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            placeholder="Write a comment..."
                            className={`flex-1 border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${
                              theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200'
                            }`}
                          />
                          <button 
                            onClick={() => handleComment(post.id)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                          >
                            Send
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section className={`rounded-[32px] p-8 border shadow-xl space-y-6 ${
            theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
          }`}>
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Trending Gigs</h3>
            <div className="space-y-4">
              {[
                { title: 'Logo Design', price: '₦5,000', trend: '+12%' },
                { title: 'Content Writing', price: '₦3,500', trend: '+8%' },
                { title: 'Web Development', price: '₦50,000', trend: '+24%' },
              ].map((gig, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                  theme === 'dark' ? 'glass border-white/5 hover:border-white/10' : 'bg-neutral-50 border-neutral-100 hover:border-emerald-500/30'
                }`}>
                  <div>
                    <p className={`text-sm font-bold group-hover:text-emerald-500 transition-colors ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{gig.title}</p>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Starting at {gig.price}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">{gig.trend}</span>
                </div>
              ))}
            </div>
            <Link to="/market" className={`block w-full py-3 rounded-2xl text-center text-xs font-bold transition-all uppercase tracking-widest border ${
              theme === 'dark' ? 'glass text-neutral-400 hover:text-white border-white/5' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border-neutral-200'
            }`}>View Marketplace</Link>
          </section>

          <section className={`rounded-[32px] p-8 border shadow-xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 ${
            theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
          }`}>
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Pro Tip</h3>
            <p className="text-sm text-neutral-500 leading-relaxed mt-2">Update your portfolio regularly to attract 3x more clients sharp sharp!</p>
            <button className="mt-4 text-xs font-bold text-blue-500 uppercase tracking-widest hover:text-blue-300 transition-colors">Update Now →</button>
          </section>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, color }: { to: string; icon: React.ReactNode; label: string; color: string }) {
  const { theme } = useTheme();
  return (
    <Link to={to} className="group">
      <div className={`p-6 rounded-[32px] flex flex-col items-center gap-4 border transition-all group-hover:scale-[1.02] active:scale-[0.98] ${
        theme === 'dark' ? 'glass border-white/10 hover:border-white/20' : 'bg-white border-neutral-200 shadow-sm hover:shadow-md'
      }`}>
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform", color)}>
          {icon}
        </div>
        <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${
          theme === 'dark' ? 'text-neutral-400 group-hover:text-white' : 'text-neutral-500 group-hover:text-neutral-900'
        }`}>{label}</span>
      </div>
    </Link>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
