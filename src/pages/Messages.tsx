import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ChevronRight, Search, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';

export default function Messages({ user }: { user: any }) {
  const { theme } = useTheme();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-3xl mx-auto pb-24">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Messages</h2>
          <div className={`p-2 rounded-xl ${theme === 'dark' ? 'glass text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}>
            <MessageSquare size={24} />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text" 
            placeholder="Search your chats..."
            className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
              theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          />
        </div>
      </header>
      
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className={`h-24 rounded-3xl animate-pulse ${theme === 'dark' ? 'glass' : 'bg-neutral-100'}`} />
          ))
        ) : jobs.length === 0 ? (
          <div className={`text-center py-12 rounded-3xl border border-dashed ${theme === 'dark' ? 'border-white/10' : 'border-neutral-200'}`}>
            <MessageSquare size={48} className="mx-auto text-neutral-700 mb-4" />
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">No active chats yet, boss.</p>
          </div>
        ) : (
          jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link 
                to={`/chat/${job.id}`}
                className={`flex items-center gap-4 p-5 rounded-[32px] border transition-all group ${
                  theme === 'dark' 
                    ? 'glass border-white/5 hover:border-white/10 hover:bg-white/5' 
                    : 'bg-white border-neutral-200 shadow-sm hover:shadow-md hover:border-emerald-500/30'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                  theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <MessageSquare size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-black truncate ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{job.title}</h4>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} />
                      Just now
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate font-medium">Tap to open chat and start business sharp sharp...</p>
                </div>
                <ChevronRight size={20} className="text-neutral-300 group-hover:text-emerald-500 transition-colors" />
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
