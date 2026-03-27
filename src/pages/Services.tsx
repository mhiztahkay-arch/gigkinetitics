import { useState, useEffect } from 'react';
import { Search, Package, Clock3, Star, Filter, MapPin, Plus, X, Video, Phone, ShieldCheck, Send, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Services() {
  const { user: authUser, dbUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  
  // Post Service Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    price: '',
    delivery_time: '2 days',
    category: 'Design'
  });

  // Escrow Payment Modal
  const [escrowTarget, setEscrowTarget] = useState<any>(null);

  // Call Simulation State
  const [activeCall, setActiveCall] = useState<any>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostService = async () => {
    if (!newService.title || !newService.price) return;
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newService,
          provider_id: authUser?.uid,
          price: parseInt(newService.price)
        })
      });
      if (res.ok) {
        setShowPostModal(false);
        fetchServices();
        setNewService({ title: '', description: '', price: '', delivery_time: '2 days', category: 'Design' });
      }
    } catch (error) {
      console.error('Failed to post service', error);
    }
  };

  const handleOrder = async () => {
    if (!escrowTarget || !dbUser) return;
    
    if (dbUser.balance < escrowTarget.price) {
      alert("Omo, your balance low. Abeg top up your wallet.");
      return;
    }

    try {
      // 1. Create Job
      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: escrowTarget.title,
          description: escrowTarget.description,
          budget: escrowTarget.price,
          client_id: dbUser.id
        })
      });
      const job = await jobRes.json();

      // 2. Initiate Escrow
      const escrowRes = await fetch('/api/escrow/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          clientId: dbUser.id,
          providerId: escrowTarget.provider_id,
          amount: escrowTarget.price
        })
      });

      if (escrowRes.ok) {
        alert("Escrow funded sharp sharp! Gig is now in progress.");
        setEscrowTarget(null);
        navigate(`/chat/${job.id}`);
      }
    } catch (error) {
      console.error('Failed to initiate order', error);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'All' || s.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Design', 'Coding', 'Writing', 'Marketing', 'Video', 'Music'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Marketplace</h2>
            <p className="text-neutral-500 text-sm font-medium">Buy professional services sharp sharp</p>
          </div>
          <button 
            onClick={() => setShowPostModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus size={18} />
            Post a Service
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
          <input
            type="text"
            placeholder="Search for services (e.g. Logo, Website, Writing)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
            }`}
          />
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button 
            key={cat} 
            onClick={() => setCategory(cat)}
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-bold whitespace-nowrap transition-all uppercase tracking-widest border ${
              category === cat 
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' 
                : (theme === 'dark' ? 'glass text-neutral-400 border-white/5 hover:text-white' : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-900')
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-64 rounded-[32px] animate-pulse ${theme === 'dark' ? 'glass' : 'bg-neutral-100'}`} />
          ))
        ) : filteredServices.length === 0 ? (
          <div className={`col-span-full text-center py-12 rounded-3xl border border-dashed ${
            theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
          }`}>
            <Package size={48} className="mx-auto text-neutral-700 mb-4" />
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">No services found matching your search.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-[32px] overflow-hidden group transition-all relative border ${
                  theme === 'dark' ? 'glass border-white/5 hover:border-blue-500/30' : 'bg-white border-neutral-200 hover:border-blue-500/30 hover:shadow-xl'
                }`}
              >
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <Link to={`/user/${service.provider_id}`} className="flex items-center gap-3 group/provider">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg bg-neutral-900 group-hover/provider:scale-105 transition-transform">
                        <img 
                          src={service.provider_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.provider_name}`} 
                          className="w-full h-full object-cover"
                          alt="avatar"
                        />
                      </div>
                      <div>
                        <h4 className={`font-black text-sm transition-colors group-hover/provider:text-blue-500 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{service.provider_name}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                          <Star size={10} className="text-amber-500 fill-amber-500" />
                          <span>4.9 (24 reviews)</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setActiveCall({ type: 'video', name: service.provider_name })}
                        className={`p-2.5 rounded-xl transition-colors ${
                          theme === 'dark' ? 'glass text-blue-400 hover:bg-blue-400/10' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <Video size={18} />
                      </button>
                      <button 
                        onClick={() => setActiveCall({ type: 'audio', name: service.provider_name })}
                        className={`p-2.5 rounded-xl transition-colors ${
                          theme === 'dark' ? 'glass text-emerald-400 hover:bg-emerald-400/10' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        <Phone size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className={`text-xl font-black leading-tight transition-colors group-hover:text-blue-500 ${
                      theme === 'dark' ? 'text-white' : 'text-neutral-900'
                    }`}>
                      {service.title}
                    </h3>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {service.description}
                    </p>
                  </div>

                  <div className={`flex items-center justify-between pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      <div className="flex items-center gap-1">
                        <Clock3 size={12} />
                        <span>{service.delivery_time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span>Verified</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase">Starting at</p>
                      <p className="text-2xl font-black text-blue-500 tracking-tighter">₦{service.price.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setEscrowTarget(service)}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all uppercase tracking-widest"
                  >
                    Order Now
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Escrow Payment Modal */}
      <AnimatePresence>
        {escrowTarget && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-[40px] p-10 space-y-8 border shadow-2xl ${
                theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-[32px] flex items-center justify-center mx-auto text-emerald-500">
                  <ShieldCheck size={40} />
                </div>
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Fund Escrow</h3>
                <p className="text-neutral-500 text-sm">You are about to fund ₦{escrowTarget.price.toLocaleString()} into escrow for "{escrowTarget.title}".</p>
              </div>

              <div className={`p-6 rounded-3xl space-y-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-neutral-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-500 uppercase">Service Price</span>
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>₦{escrowTarget.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-500 uppercase">Escrow Fee</span>
                  <span className="text-emerald-500 font-bold">₦0.00 (Free)</span>
                </div>
                <div className="pt-4 border-t border-neutral-200 flex justify-between items-center">
                  <span className="text-sm font-black uppercase">Total to Pay</span>
                  <span className="text-xl font-black text-emerald-500">₦{escrowTarget.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setEscrowTarget(null)}
                  className={`flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all ${
                    theme === 'dark' ? 'glass border-white/10 text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleOrder}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Wallet size={16} />
                  Pay Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Service Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-[40px] p-10 space-y-8 border shadow-2xl ${
                theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Post a Service</h3>
                <button onClick={() => setShowPostModal(false)} className="p-2 glass rounded-xl text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Service Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. I will design a professional logo"
                    value={newService.title}
                    onChange={(e) => setNewService({...newService, title: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Price (₦)</label>
                    <input 
                      type="number" 
                      placeholder="5000"
                      value={newService.price}
                      onChange={(e) => setNewService({...newService, price: e.target.value})}
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Category</label>
                    <select 
                      value={newService.category}
                      onChange={(e) => setNewService({...newService, category: e.target.value})}
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    >
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe what you will do..."
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
              </div>

              <button 
                onClick={handlePostService}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
              >
                List Service Sharp Sharp
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Call Simulation */}
      <AnimatePresence>
        {activeCall && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-3xl">
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full h-full flex flex-col items-center justify-center p-8 space-y-12"
            >
              <div className="relative">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500 animate-pulse shadow-2xl shadow-blue-500/50">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCall.name}`} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-600 p-4 rounded-full text-white shadow-xl">
                  {activeCall.type === 'video' ? <Video size={24} /> : <Phone size={24} />}
                </div>
              </div>

              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tight">{activeCall.name}</h2>
                <p className="text-blue-400 font-black animate-pulse uppercase tracking-widest text-sm">
                  {activeCall.type === 'video' ? 'Video Calling...' : 'Audio Calling...'}
                </p>
              </div>

              <div className="flex gap-12">
                <button 
                  onClick={() => setActiveCall(null)}
                  className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-red-600/40 hover:scale-110 active:scale-90 transition-all"
                >
                  <X size={36} />
                </button>
                <button 
                  className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-600/40 hover:scale-110 active:scale-90 transition-all"
                >
                  <Phone size={36} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
