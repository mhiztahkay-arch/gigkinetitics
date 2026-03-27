import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Briefcase, Star, Clock, Globe, Shield, 
  ChevronRight, MessageSquare, Heart, Share2, 
  CheckCircle2, Award, Zap, ArrowLeft, Plus, X,
  ShieldCheck, DollarSign
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';

export default function UserProfile({ user: authUser }: { user: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { refreshUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [hireData, setHireData] = useState({
    title: '',
    description: '',
    budget: ''
  });
  const [hiring, setHiring] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchPortfolio();
    fetchServices();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`/api/portfolio/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio', error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`/api/services/${id}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services', error);
    }
  };

  const handleHire = async () => {
    if (!hireData.title || !hireData.budget) return;
    setHiring(true);
    try {
      const res = await fetch('/api/jobs/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: authUser.id,
          providerId: user.id,
          title: hireData.title,
          description: hireData.description,
          budget: parseInt(hireData.budget)
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert('Hired sharp sharp! Funds are held in escrow.');
        setIsHireModalOpen(false);
        navigate(`/chat/${data.jobId}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to hire');
      }
    } catch (error) {
      console.error('Hire error', error);
    } finally {
      setHiring(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-neutral-50'} pb-24`}>
      {/* Banner */}
      <div className="h-40 sm:h-48 bg-gradient-to-r from-emerald-900 via-blue-900 to-purple-900 relative group overflow-hidden">
        {user.cover_url ? (
          <img src={user.cover_url} className="w-full h-full object-cover" alt="cover" />
        ) : (
          <div className="w-full h-full bg-neutral-900/50 backdrop-blur-3xl" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 glass rounded-xl text-white hover:bg-white/20 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="px-3 sm:px-4 -mt-12 sm:-mt-20 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <section className={`rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 space-y-4 sm:space-y-6 relative border shadow-2xl backdrop-blur-2xl transition-colors ${
          theme === 'dark' ? 'glass border-white/10' : 'bg-white/90 border-neutral-200'
        }`}>
          <div className="flex justify-between items-start">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-[24px] sm:rounded-[32px] overflow-hidden border-4 border-black shadow-2xl bg-neutral-900">
                <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-8 sm:h-8 rounded-full border-4 border-black ${
                user.availability_status === 'available' ? 'bg-emerald-500' :
                user.availability_status === 'busy' ? 'bg-amber-500' : 'bg-neutral-500'
              }`} />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsHireModalOpen(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <Zap size={18} />
                Hire Now
              </button>
              <button className={`p-3 rounded-2xl transition-all ${
                theme === 'dark' ? 'glass text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}>
                <MessageSquare size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{user.name}</h1>
              <CheckCircle2 size={20} className="text-blue-500" />
            </div>
            <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs sm:text-sm">{user.role}</p>
            <div className="flex flex-wrap gap-3 sm:gap-6 pt-2">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs sm:text-sm font-medium">
                <MapPin size={14} className="text-neutral-400" />
                {user.location || 'Nigeria'}
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs sm:text-sm font-medium">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                4.9 (12 reviews)
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs sm:text-sm font-medium">
                <Clock size={14} className="text-neutral-400" />
                Joined {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(user.skills || '').split(',').map((skill: string, i: number) => (
              <span key={i} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                theme === 'dark' ? 'bg-white/5 text-neutral-400 border border-white/5' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
              }`}>
                {skill.trim()}
              </span>
            ))}
          </div>
        </section>

        {/* Bio & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <section className={`lg:col-span-2 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 space-y-4 border shadow-xl transition-colors ${
            theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
          }`}>
            <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>About</h3>
            <p className={`text-sm sm:text-base leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {user.bio || "No bio yet. This user is busy building great things!"}
            </p>
          </section>

          <section className={`rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 space-y-6 border shadow-xl transition-colors ${
            theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
          }`}>
            <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-medium">Comm. Style</span>
                <span className="text-xs font-bold text-emerald-500 uppercase">{user.comm_style || 'Informal'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-medium">Language</span>
                <span className="text-xs font-bold text-blue-500 uppercase">{user.preferred_language || 'English'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-medium">Availability</span>
                <span className="text-xs font-bold text-purple-500 uppercase">{user.availability_status || 'Available'}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Portfolio */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Portfolio</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {portfolio.map((item) => (
              <motion.div 
                key={item.id}
                whileHover={{ y: -5 }}
                className={`rounded-[24px] sm:rounded-[32px] overflow-hidden border shadow-xl group transition-colors ${
                  theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
                }`}
              >
                <div className="h-40 sm:h-48 overflow-hidden relative">
                  <img src={item.image_url || 'https://picsum.photos/800/600'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Globe size={24} className="text-white" />
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h4 className={`font-bold text-sm sm:text-base ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{item.title}</h4>
                  <p className="text-xs text-neutral-500 line-clamp-2">{item.description}</p>
                </div>
              </motion.div>
            ))}
            {portfolio.length === 0 && (
              <div className={`col-span-full py-12 text-center rounded-[32px] border-2 border-dashed ${
                theme === 'dark' ? 'border-white/5 text-neutral-500' : 'border-neutral-200 text-neutral-400'
              }`}>
                No portfolio items yet.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Hire Modal */}
      <AnimatePresence>
        {isHireModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-[40px] p-8 space-y-6 border shadow-2xl ${
                theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Hire {user.name}</h3>
                <button onClick={() => setIsHireModalOpen(false)} className="p-2 glass rounded-xl text-neutral-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Job Title</label>
                  <input 
                    type="text" 
                    value={hireData.title}
                    onChange={(e) => setHireData({...hireData, title: e.target.value})}
                    placeholder="e.g. Build my React App"
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Budget (₦)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type="number" 
                      value={hireData.budget}
                      onChange={(e) => setHireData({...hireData, budget: e.target.value})}
                      placeholder="50000"
                      className={`w-full border rounded-2xl pl-12 pr-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    rows={3}
                    value={hireData.description}
                    onChange={(e) => setHireData({...hireData, description: e.target.value})}
                    placeholder="What do you need done?"
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-2xl flex items-start gap-3 ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                <ShieldCheck size={20} className="shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  Funds will be held in GigKinetics Escrow and only released when you are satisfied.
                </p>
              </div>

              <button
                onClick={handleHire}
                disabled={hiring || !hireData.title || !hireData.budget}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {hiring ? 'Hiring...' : 'Confirm & Fund Escrow'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
