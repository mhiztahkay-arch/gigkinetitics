import { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Heart, Share2, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { Link } from 'react-router-dom';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        searchPosts();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setResults([]);
    }
  }, [query]);

  const searchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const posts = await res.json();
        const filtered = posts.filter((p: any) => 
          (p.content?.toLowerCase() || '').includes(query.toLowerCase()) ||
          (p.user_name?.toLowerCase() || '').includes(query.toLowerCase())
        );
        setResults(filtered);
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-6 lg:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`relative w-full max-w-2xl rounded-[32px] overflow-hidden border shadow-2xl ${
              theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center gap-3 sm:gap-4">
              <Search className="text-neutral-500" size={20} />
              <input 
                autoFocus
                type="text" 
                placeholder="Search posts, users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`flex-1 bg-transparent border-none outline-none text-base sm:text-lg font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-neutral-900'
                }`}
              />
              <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 no-scrollbar">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Searching the feed...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((post) => (
                    <Link 
                      key={post.id} 
                      to="/" 
                      onClick={onClose}
                      className={`block p-4 rounded-2xl border transition-all ${
                        theme === 'dark' ? 'glass border-white/5 hover:bg-white/5' : 'bg-neutral-50 border-neutral-100 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={post.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_name}`} 
                          className="w-8 h-8 rounded-lg" 
                          alt="" 
                        />
                        <div>
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{post.user_name}</p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} />
                            Just now
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm line-clamp-2 mb-3 ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Heart size={12} className="text-red-500" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} className="text-blue-500" />
                          {post.comments_count || 0}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : query.length > 2 ? (
                <div className="py-12 text-center">
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No posts found matching "{query}"</p>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Type at least 3 characters to search</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
