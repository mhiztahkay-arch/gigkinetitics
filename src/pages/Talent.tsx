import { useState, useEffect } from 'react';
import { Search, User, MapPin, Star, Briefcase, ChevronRight, Filter, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';

export default function Talent() {
  const { theme } = useTheme();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTalent();
  }, []);

  const fetchTalent = async () => {
    try {
      const usersRes = await fetch('/api/providers');
      if (usersRes.ok) {
        const data = await usersRes.json();
        setTalents(data);
      }
    } catch (error) {
      console.error('Failed to fetch talent', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTalent = talents.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.skills?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Talent Directory</h2>
            <p className="text-neutral-500 text-sm font-medium">Find and connect with top Nigerian professionals</p>
          </div>
          <div className="flex gap-2">
            <button className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest border flex items-center gap-2 ${
              theme === 'dark' ? 'glass text-white border-white/5 hover:bg-white/5' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}>
              <Filter size={16} />
              Filter
            </button>
            <Link to="/post-job" className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-lg shadow-emerald-600/20">
              Post a Gig
            </Link>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, skill, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
              theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-64 rounded-[32px] animate-pulse ${theme === 'dark' ? 'glass' : 'bg-neutral-100'}`} />
          ))
        ) : filteredTalent.length === 0 ? (
          <div className={`col-span-full text-center py-12 rounded-3xl border border-dashed ${
            theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
          }`}>
            <User size={48} className="mx-auto text-neutral-700 mb-4" />
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">No talent found matching your search.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTalent.map((talent) => (
              <motion.div
                key={talent.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-[32px] p-8 border transition-all group relative overflow-hidden ${
                  theme === 'dark' ? 'glass border-white/5 hover:border-emerald-500/30' : 'bg-white border-neutral-200 hover:border-emerald-500/30 hover:shadow-xl'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-[24px] overflow-hidden border-4 border-black shadow-xl bg-neutral-900">
                        <img src={talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.name}`} alt="avatar" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-black ${
                        talent.availability_status === 'available' ? 'bg-emerald-500' :
                        talent.availability_status === 'busy' ? 'bg-amber-500' : 'bg-neutral-500'
                      }`} />
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} className="fill-amber-500" />
                      <span className="text-xs font-bold">4.9</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className={`text-xl font-black tracking-tight group-hover:text-emerald-500 transition-colors ${
                      theme === 'dark' ? 'text-white' : 'text-neutral-900'
                    }`}>{talent.name}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                      <MapPin size={12} className="text-emerald-500" />
                      <span>{talent.location || 'Nigeria'}</span>
                    </div>
                  </div>

                  <p className={`text-xs line-clamp-2 leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {talent.bio || 'Professional GigKinetics talent ready to deliver sharp sharp.'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {talent.skills?.split(',').slice(0, 3).map((skill: string, i: number) => (
                      <span key={i} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        theme === 'dark' ? 'glass text-neutral-400 border-white/5' : 'bg-neutral-50 text-neutral-600 border-neutral-100'
                      }`}>
                        {skill.trim()}
                      </span>
                    ))}
                    {talent.skills?.split(',').length > 3 && (
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                        theme === 'dark' ? 'glass text-neutral-500' : 'bg-neutral-50 text-neutral-400'
                      }`}>
                        +{talent.skills.split(',').length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest">
                      Hire Now
                    </button>
                    <Link 
                      to={`/user/${talent.id}`} 
                      className={`px-4 py-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center ${
                        theme === 'dark' ? 'glass text-white hover:bg-white/5' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                      }`}
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
