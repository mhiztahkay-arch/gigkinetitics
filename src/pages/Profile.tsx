import { useState, useEffect } from 'react';
import { Camera, MapPin, Briefcase, Mail, Globe, Plus, Trash2, Edit2, Check, X, Package, Star, Users, Share2, MoreHorizontal, Award, Zap, LogOut, Wallet, History, ShieldCheck, ChevronRight, Clock3, FileText, Lock, Sun, Moon, Shield, Phone, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../lib/ThemeContext';
import { uploadFile } from '../lib/upload';

import { useAuth } from '../lib/AuthContext';

export default function Profile({ user: initialUser }: { user: any }) {
  const { theme, setTheme } = useTheme();
  const { refreshUser } = useAuth();
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: initialUser.name || '',
    legal_name: initialUser.legal_name || '',
    mobile_number: initialUser.mobile_number || '',
    security_pin: initialUser.security_pin || '',
    skills: initialUser.skills || '',
    role: initialUser.role || 'provider',
    bio: initialUser.bio || '',
    location: initialUser.location || '',
    avatar_url: initialUser.avatar_url || '',
    cover_url: initialUser.cover_url || '',
    theme_preference: initialUser.theme_preference || 'light',
    personality_traits: initialUser.personality_traits || '',
    availability_status: initialUser.availability_status || 'available',
    comm_style: initialUser.comm_style || 'informal',
    preferred_language: initialUser.preferred_language || 'English'
  });
  const [saving, setSaving] = useState(false);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [activeTab, setActiveTab] = useState('about');
  const [showDocPermission, setShowDocPermission] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [commissionSettings, setCommissionSettings] = useState({
    type: 'opay',
    account_number: '',
    account_name: '',
    email: ''
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    description: '',
    image_url: '',
    project_url: ''
  });
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setUser(initialUser);
    setEditData({
      name: initialUser.name || '',
      legal_name: initialUser.legal_name || '',
      mobile_number: initialUser.mobile_number || '',
      security_pin: initialUser.security_pin || '',
      skills: initialUser.skills || '',
      role: initialUser.role || 'provider',
      bio: initialUser.bio || '',
      location: initialUser.location || '',
      avatar_url: initialUser.avatar_url || '',
      cover_url: initialUser.cover_url || '',
      theme_preference: initialUser.theme_preference || 'light',
      personality_traits: initialUser.personality_traits || '',
      availability_status: initialUser.availability_status || 'available',
      comm_style: initialUser.comm_style || 'informal',
      preferred_language: initialUser.preferred_language || 'English'
    });
    fetchPortfolio();
    fetchServices();
    fetchStats();
    if (initialUser.is_admin) {
      fetchAdminData();
      fetchCommissionSettings();
    }
  }, [initialUser]);

  const fetchCommissionSettings = async () => {
    try {
      const res = await fetch('/api/settings/commission');
      if (res.ok) {
        setCommissionSettings(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch commission settings', error);
    }
  };

  const handleUpdateCommission = async () => {
    setUpdatingSettings(true);
    try {
      const res = await fetch('/api/settings/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commissionSettings)
      });
      if (res.ok) {
        alert("Commission settings updated sharp sharp!");
      }
    } catch (error) {
      console.error('Failed to update commission settings', error);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats')
      ]);
      if (usersRes.ok) setAdminUsers(await usersRes.json());
      if (statsRes.ok) setAdminStats(await statsRes.json());
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/connections/${initialUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`/api/portfolio/${initialUser.id}`);
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
      const res = await fetch(`/api/services/${initialUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      setEditData(prev => ({ ...prev, [type === 'avatar' ? 'avatar_url' : 'cover_url']: url }));
      alert(`${type === 'avatar' ? 'Avatar' : 'Cover'} photo uploaded! Don't forget to save changes.`);
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ...editData })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setIsEditing(false);
        if (updatedUser.theme_preference) {
          setTheme(updatedUser.theme_preference);
        }
        await refreshUser();
        alert('Profile updated sharp sharp!');
      }
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPortfolio = async () => {
    if (!newPortfolioItem.title) return;
    setIsAddingPortfolio(true);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPortfolioItem, user_id: user.id })
      });
      if (res.ok) {
        await fetchPortfolio();
        setShowAddPortfolioModal(false);
        setNewPortfolioItem({ title: '', description: '', image_url: '', project_url: '' });
      }
    } catch (error) {
      console.error('Failed to add portfolio item', error);
    } finally {
      setIsAddingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPortfolio();
      }
    } catch (error) {
      console.error('Failed to delete portfolio item', error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const requestDocPermission = () => {
    setShowDocPermission(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-neutral-50'} pb-24`}>
      {/* Banner */}
      <div className="h-40 sm:h-48 bg-gradient-to-r from-emerald-900 via-blue-900 to-purple-900 relative group overflow-hidden">
        {user.cover_url ? (
          <img src={user.cover_url} className="w-full h-full object-cover" alt="cover" />
        ) : (
          <div className="w-full h-full bg-neutral-900/50 backdrop-blur-3xl" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
        <label className="absolute bottom-4 right-4 p-2 sm:p-3 glass rounded-xl sm:rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest cursor-pointer">
          <Camera size={16} />
          {isUploading ? 'Uploading...' : 'Change Cover'}
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'cover')}
            disabled={isUploading}
          />
        </label>
      </div>

      <div className="px-3 sm:px-4 -mt-12 sm:-mt-20 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <section className={`rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 space-y-4 sm:space-y-6 relative border shadow-2xl backdrop-blur-2xl transition-colors ${
          theme === 'dark' ? 'glass border-white/10' : 'bg-white/90 border-neutral-200'
        }`}>
          <div className="flex justify-between items-start">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-[24px] sm:rounded-[32px] overflow-hidden border-4 border-black shadow-2xl bg-neutral-900">
                <img src={editData.avatar_url || user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px] sm:rounded-[32px] cursor-pointer">
                <Camera size={20} className="text-white" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'avatar')}
                  disabled={isUploading}
                />
              </label>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-8 sm:h-8 rounded-full border-4 border-black ${
                user.availability_status === 'available' ? 'bg-emerald-500' :
                user.availability_status === 'busy' ? 'bg-amber-500' : 'bg-neutral-500'
              }`} />
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${
                  theme === 'dark' ? 'glass text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                {isEditing ? <X size={18} /> : <Edit2 size={18} />}
              </button>
              <button className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${
                theme === 'dark' ? 'glass text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}>
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2">
              <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{user.name}</h2>
              <Award size={16} className="text-blue-400" />
            </div>
            {user.legal_name && (
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                Legal Name: {user.legal_name}
              </p>
            )}
            {user.mobile_number && (
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                <Phone size={12} className="text-blue-500" />
                Account Number: {user.mobile_number}
              </p>
            )}
            <p className="text-emerald-500 font-bold text-sm uppercase tracking-widest">{user.role}</p>
            <p className={`text-sm leading-relaxed max-w-md ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {user.bio || "No bio yet. This professional is ready to take on new challenges!"}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-500" />
              <span>{user.location || 'Nigeria'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" />
              <span>{user.personality_traits || 'Professional'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-blue-500" />
              <span className={theme === 'dark' ? 'text-white' : 'text-neutral-900'}>{stats.followers}</span>
              <span>Followers</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
              Connect
            </button>
            <button className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
              theme === 'dark' ? 'glass text-white hover:bg-white/5' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
            }`}>
              Message
            </button>
          </div>
        </section>

        {/* Tabs */}
        <div className={`flex gap-6 border-b px-2 overflow-x-auto no-scrollbar ${theme === 'dark' ? 'border-white/5' : 'border-neutral-200'}`}>
          {['about', 'portfolio', 'services', 'account', ...(user.is_admin ? ['admin'] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                activeTab === tab ? 'text-emerald-500' : 'text-neutral-500 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'about' && (
            <motion.section 
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className={`p-6 rounded-3xl space-y-4 border ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'
              }`}>
                <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills?.split(',').map((skill: string, i: number) => (
                    <span key={i} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      theme === 'dark' ? 'glass text-emerald-400 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    }`}>
                      {skill.trim()}
                    </span>
                  )) || <p className="text-xs text-neutral-500 italic">No skills listed yet.</p>}
                </div>
              </div>

              {/* Document Center */}
              <div className={`p-6 rounded-3xl space-y-4 border ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Document Center</h3>
                  <button 
                    onClick={requestDocPermission}
                    className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                  >
                    Upload New
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                    theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-neutral-50 border-neutral-100'
                  }`}>
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>ID Card.pdf</p>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">Verified • 2.4MB</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                    theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-neutral-50 border-neutral-100'
                  }`}>
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Bank Statement.pdf</p>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">Pending • 1.1MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'portfolio' && (
            <motion.section 
              key="portfolio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Portfolio Projects</h3>
                <button 
                  onClick={() => setShowAddPortfolioModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all"
                >
                  <Plus size={14} />
                  Add Project
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {portfolio.length === 0 ? (
                  <div className={`col-span-full text-center py-12 rounded-3xl border ${
                    theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'
                  }`}>
                    <Briefcase size={48} className="mx-auto text-neutral-700 mb-4" />
                    <p className="text-neutral-500">No portfolio items yet.</p>
                  </div>
                ) : (
                  portfolio.map((item) => (
                    <div key={item.id} className={`rounded-[32px] overflow-hidden group border transition-all relative ${
                      theme === 'dark' ? 'glass border-white/5 hover:border-white/10' : 'bg-white border-neutral-200 hover:shadow-lg'
                    }`}>
                      {item.image_url && (
                        <img src={item.image_url} className="w-full h-48 object-cover" alt="portfolio" />
                      )}
                      <div className="p-6 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{item.title}</h4>
                          <button 
                            onClick={() => handleDeletePortfolio(item.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
                        {item.project_url && (
                          <a 
                            href={item.project_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:underline pt-2"
                          >
                            View Project <ChevronRight size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.section>
          )}

          {activeTab === 'services' && (
            <motion.section 
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 gap-4"
            >
              {services.length === 0 ? (
                <div className={`text-center py-12 rounded-3xl border ${
                  theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'
                }`}>
                  <Package size={48} className="mx-auto text-neutral-700 mb-4" />
                  <p className="text-neutral-500">No services listed yet.</p>
                </div>
              ) : (
                services.map((service) => (
                  <div key={service.id} className={`rounded-3xl p-6 space-y-4 border transition-all ${
                    theme === 'dark' ? 'glass border-white/5 hover:border-white/10' : 'bg-white border-neutral-200 hover:shadow-md'
                  }`}>
                    <div className="flex justify-between items-start">
                      <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{service.title}</h4>
                      <p className="text-lg font-bold text-emerald-500">₦{service.price.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{service.description}</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      <div className="flex items-center gap-1">
                        <Clock3 size={12} />
                        <span>{service.delivery_time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.section>
          )}

          {activeTab === 'account' && (
            <motion.section 
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className={`rounded-3xl overflow-hidden divide-y border ${
                theme === 'dark' ? 'glass border-white/5 divide-white/5' : 'bg-white border-neutral-200 divide-neutral-100 shadow-sm'
              }`}>
                <MenuLink to="/wallet" icon={<Wallet size={20} className="text-blue-500" />} label="My Wallet" value={`₦${user.balance?.toLocaleString() || 0}`} />
                <MenuLink to="/history" icon={<History size={20} className="text-amber-500" />} label="Transaction History" />
                <MenuLink to="/verification" icon={<ShieldCheck size={20} className="text-emerald-500" />} label="Identity Verification" badge="Verified" />
                
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
                      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}`}>App Theme</span>
                  </div>
                  <div className="flex p-1 bg-neutral-900/50 rounded-xl border border-white/5">
                    <button 
                      onClick={() => {
                        setTheme('light');
                        setEditData({...editData, theme_preference: 'light'});
                      }}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        theme === 'light' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      Light
                    </button>
                    <button 
                      onClick={() => {
                        setTheme('dark');
                        setEditData({...editData, theme_preference: 'dark'});
                      }}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        theme === 'dark' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                      <Lock size={20} />
                    </div>
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}`}>Security PIN</span>
                  </div>
                  <button 
                    onClick={() => {
                      const pin = prompt('Enter new 4-digit PIN:');
                      if (pin && pin.length === 4) {
                        setEditData({...editData, security_pin: pin});
                        alert('PIN updated! It will be required next time you open the app.');
                      }
                    }}
                    className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest"
                  >
                    {user.security_pin ? 'Update PIN' : 'Set PIN'}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className={`w-full p-4 rounded-2xl flex items-center justify-center gap-2 text-red-500 font-bold transition-colors border ${
                  theme === 'dark' ? 'glass border-white/5 hover:bg-red-500/10' : 'bg-red-50 border-red-100 hover:bg-red-100'
                }`}
              >
                <LogOut size={20} />
                Log Out
              </button>
            </motion.section>
          )}
          {activeTab === 'admin' && user.is_admin && (
            <motion.section 
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Admin Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Users</p>
                  <p className="text-3xl font-black text-emerald-500">{adminStats?.totalUsers || 0}</p>
                </div>
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Gigs</p>
                  <p className="text-3xl font-black text-blue-500">{adminStats?.totalJobs || 0}</p>
                </div>
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Escrow Held</p>
                  <p className="text-3xl font-black text-amber-500">₦{(adminStats?.totalEscrow || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Platform Settings */}
              <div className={`p-8 rounded-[40px] border space-y-8 ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Platform Settings</h3>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Configure commission reception</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Reception Method</label>
                    <select 
                      value={commissionSettings.type}
                      onChange={(e) => setCommissionSettings({...commissionSettings, type: e.target.value})}
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    >
                      <option value="opay">OPay</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Account Number / ID</label>
                    <input 
                      type="text" 
                      value={commissionSettings.account_number}
                      onChange={(e) => setCommissionSettings({...commissionSettings, account_number: e.target.value})}
                      placeholder="e.g. 8144990299"
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Account Name</label>
                    <input 
                      type="text" 
                      value={commissionSettings.account_name}
                      onChange={(e) => setCommissionSettings({...commissionSettings, account_name: e.target.value})}
                      placeholder="e.g. Samuel Kayode Oluhayero"
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Email (for PayPal/Alerts)</label>
                    <input 
                      type="email" 
                      value={commissionSettings.email}
                      onChange={(e) => setCommissionSettings({...commissionSettings, email: e.target.value})}
                      placeholder="admin@gigkinetics.com"
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUpdateCommission}
                  disabled={updatingSettings}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {updatingSettings ? "Updating..." : "Save Platform Settings"}
                </button>
              </div>

              {/* User Management */}
              <div className={`rounded-[32px] border overflow-hidden ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>User Management</h3>
                  <div className="flex items-center gap-4">
                    <Link to="/admin/db" className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                      <Database size={12} />
                      Database Admin
                    </Link>
                    <button onClick={fetchAdminData} className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Refresh</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Balance</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminUsers.map((u) => (
                        <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-8 h-8 rounded-lg" alt="" />
                              <div>
                                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{u.name}</p>
                                <p className="text-[10px] text-neutral-500">{u.email || 'No email'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.is_admin ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {u.is_admin ? 'Admin' : u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-emerald-500">₦{(u.balance || 0).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`w-2 h-2 rounded-full inline-block ${u.availability_status === 'available' ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 space-y-6 sm:space-y-8 border shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar ${
                theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="p-2 glass rounded-xl text-neutral-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Display Name</label>
                  <input 
                    type="text" 
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    placeholder="Wetin be your name?"
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Legal Name (As in Bank/ID)</label>
                  <input 
                    type="text" 
                    value={editData.legal_name}
                    onChange={(e) => setEditData({...editData, legal_name: e.target.value})}
                    placeholder="Enter your official name"
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Mobile Number (Account Number)</label>
                  <input 
                    type="text" 
                    value={editData.mobile_number}
                    onChange={(e) => setEditData({...editData, mobile_number: e.target.value})}
                    placeholder="Enter your mobile number"
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Bio</label>
                  <textarea 
                    rows={3}
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    placeholder="Tell us small about yourself..."
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Skills (comma separated)</label>
                  <input 
                    type="text" 
                    value={editData.skills}
                    onChange={(e) => setEditData({...editData, skills: e.target.value})}
                    placeholder="React, Design, Writing..."
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Location</label>
                    <input 
                      type="text" 
                      value={editData.location}
                      onChange={(e) => setEditData({...editData, location: e.target.value})}
                      placeholder="Lagos, Nigeria"
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</label>
                    <select 
                      value={editData.availability_status}
                      onChange={(e) => setEditData({...editData, availability_status: e.target.value})}
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    >
                      <option value="available">Available (Sharp Sharp)</option>
                      <option value="busy">Busy (Small Small)</option>
                      <option value="away">Away (I Dey Come)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Comm. Style</label>
                    <select 
                      value={editData.comm_style}
                      onChange={(e) => setEditData({...editData, comm_style: e.target.value})}
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    >
                      <option value="formal">Formal</option>
                      <option value="informal">Informal</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Language</label>
                    <select 
                      value={editData.preferred_language}
                      onChange={(e) => setEditData({...editData, preferred_language: e.target.value})}
                      className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    >
                      <option value="English">English</option>
                      <option value="Yoruba">Yoruba</option>
                      <option value="Igbo">Igbo</option>
                      <option value="Hausa">Hausa</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
              >
                {saving ? 'Saving...' : 'Update Profile Sharp Sharp'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Permission Modal */}
      <AnimatePresence>
        {showDocPermission && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-sm rounded-[40px] p-10 space-y-8 text-center border ${
                theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                <Shield size={40} />
              </div>
              <div className="space-y-2">
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Access Documents?</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  GigKinetics needs permission to access your documents for identity verification and portfolio uploads.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setShowDocPermission(false);
                    alert('Access Granted! You can now select files.');
                  }}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                >
                  Allow Access
                </button>
                <button 
                  onClick={() => setShowDocPermission(false)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${
                    theme === 'dark' ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  Not Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Portfolio Modal */}
      <AnimatePresence>
        {showAddPortfolioModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-[40px] p-10 space-y-8 border shadow-2xl ${
                theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Add Project</h3>
                <button onClick={() => setShowAddPortfolioModal(false)} className="p-2 glass rounded-xl text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Project Title</label>
                  <input 
                    type="text" 
                    placeholder="E.g. E-commerce Website"
                    value={newPortfolioItem.title}
                    onChange={(e) => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    placeholder="Tell us about the project..."
                    value={newPortfolioItem.description}
                    onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px] ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Project Image</label>
                  <div className="flex items-center gap-4">
                    {newPortfolioItem.image_url && (
                      <img src={newPortfolioItem.image_url} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="preview" />
                    )}
                    <label className={`flex-1 flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-all ${
                      theme === 'dark' ? 'border-white/10 hover:border-emerald-500/50 hover:bg-white/5' : 'border-neutral-200 hover:border-emerald-500/50 hover:bg-neutral-50'
                    }`}>
                      <Camera size={20} className="text-neutral-500" />
                      <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        {isUploading ? 'Uploading...' : 'Upload Project Image'}
                      </span>
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
                            setNewPortfolioItem({ ...newPortfolioItem, image_url: url });
                          } catch (error) {
                            alert('Upload failed');
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Project Link (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="https://github.com/..."
                    value={newPortfolioItem.project_url}
                    onChange={(e) => setNewPortfolioItem({...newPortfolioItem, project_url: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
              </div>

              <button 
                onClick={handleAddPortfolio}
                disabled={isAddingPortfolio || !newPortfolioItem.title}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAddingPortfolio ? 'Adding...' : 'Add Project Sharp Sharp'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({ to, icon, label, value, badge }: { to: string; icon: React.ReactNode; label: string; value?: string; badge?: string }) {
  const { theme } = useTheme();
  return (
    <Link to={to} className={`flex items-center justify-between p-5 transition-colors ${
      theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-neutral-50'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          theme === 'dark' ? 'bg-white/5' : 'bg-neutral-100'
        }`}>
          {icon}
        </div>
        <span className={`text-sm font-bold ${theme === 'dark' ? 'text-neutral-200' : 'text-neutral-700'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{value}</span>}
        {badge && <span className="text-[10px] font-bold bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">{badge}</span>}
        <ChevronRight size={16} className="text-neutral-500" />
      </div>
    </Link>
  );
}
