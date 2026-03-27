import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, Bot, Briefcase, User, Bell, Package, Users, Search, Wallet, Shield } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import WalletPage from './pages/Wallet';
import PinLock from './components/PinLock';
import Camera from './pages/Camera';
import JobDetails from './pages/JobDetails';
import Jobs from './pages/Jobs';
import Services from './pages/Services';
import Talent from './pages/Talent';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import PostJob from './pages/PostJob';
import AIChat from './pages/AIChat';
import DatabaseAdmin from './pages/DatabaseAdmin';
import GlobalSearch from './components/GlobalSearch';
import PolicyModal from './components/PolicyModal';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider, useTheme } from './lib/ThemeContext';
import { requestHardwarePermissions } from './lib/permissions';
import Login from './pages/Login';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function AppContent() {
  const { user, loading, dbUser, refreshUser } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(() => {
    return sessionStorage.getItem('gigkinetics_session_active') === 'true';
  });

  useEffect(() => {
    if (user) {
      requestHardwarePermissions();
    }
  }, [user]);

  useEffect(() => {
    if (dbUser?.security_pin) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setIsLocked(true);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [dbUser?.security_pin]);

  const handleStartSession = () => {
    sessionStorage.setItem('gigkinetics_session_active', 'true');
    setSessionStarted(true);
  };

  useEffect(() => {
    if (dbUser && !dbUser.has_accepted_policy) {
      setShowPolicy(true);
    } else {
      setShowPolicy(false);
    }
  }, [dbUser]);

  const handleAcceptPolicy = async () => {
    if (!dbUser) return;
    try {
      const res = await fetch('/api/users/accept-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dbUser.id })
      });
      if (res.ok) {
        await refreshUser();
        setShowPolicy(false);
      }
    } catch (error) {
      console.error('Failed to accept policy', error);
    }
  };

  // Use dbUser if available, otherwise fallback to a generic provider
  const currentUser = dbUser || { id: user?.uid || 'guest', name: user?.displayName || 'User', role: 'provider' };

  useEffect(() => {
    if (sessionStarted && dbUser) {
      if (dbUser.is_admin && location.pathname === '/') {
        navigate('/admin');
      } else if (!dbUser.is_admin && location.pathname.startsWith('/admin')) {
        navigate('/');
      }
    }
  }, [sessionStarted, dbUser, location.pathname, navigate]);

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-neutral-50'}`}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-emerald-700 font-bold animate-pulse">GigKinetics is loading...</p>
    </div>
  </div>;

  if (!user || !sessionStarted) {
    return <Login onLoginSuccess={handleStartSession} />;
  }

  if (isLocked && dbUser?.security_pin) {
    return <PinLock correctPin={dbUser.security_pin} onSuccess={() => setIsLocked(false)} />;
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans transition-colors duration-300",
      theme === 'dark' ? "bg-black text-white" : "bg-neutral-50 text-neutral-900"
    )}>
        {/* Header */}
        <header className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-3xl transition-colors",
          theme === 'dark' ? "glass border-white/5" : "glass-light border-neutral-200"
        )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Home size={24} className="text-white fill-white" />
              </div>
              <h1 className={cn(
                "text-xl font-black tracking-tighter hidden sm:block",
                theme === 'dark' ? "text-white" : "text-neutral-900"
              )}>GIG<span className="text-emerald-500">KINETICS</span></h1>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  theme === 'dark' ? "glass text-neutral-400 hover:text-white hover:bg-white/10" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                )}
              >
                <Search size={20} />
              </button>
              <Link to="/messages" className={cn(
                "p-2.5 rounded-xl transition-all relative",
                theme === 'dark' ? "glass text-neutral-400 hover:text-white hover:bg-white/10" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              )}>
                <MessageSquare size={20} />
              </Link>
              <Link to="/notifications" className={cn(
                "p-2.5 rounded-xl transition-all relative",
                theme === 'dark' ? "glass text-neutral-400 hover:text-white hover:bg-white/10" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              )}>
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-black"></span>
              </Link>
              {currentUser.is_admin === 1 && (
                <Link to="/admin" className={cn(
                  "p-2.5 rounded-xl transition-all relative",
                  theme === 'dark' ? "glass text-emerald-500 hover:text-emerald-400 hover:bg-white/10" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                )}>
                  <Shield size={20} />
                </Link>
              )}
              <Link to="/profile" className={cn(
                "w-10 h-10 rounded-xl overflow-hidden border transition-colors",
                theme === 'dark' ? "border-white/10 hover:border-emerald-500" : "border-neutral-200 hover:border-emerald-600"
              )}>
                <img src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} alt="avatar" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard user={currentUser} />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/market" element={<Services />} />
            <Route path="/talent" element={<Talent />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/messages" element={<Messages user={currentUser} />} />
            <Route path="/profile" element={<Profile user={currentUser} />} />
            <Route path="/user/:id" element={<UserProfile user={currentUser} />} />
            <Route path="/settings" element={<Settings user={currentUser} />} />
            <Route path="/chat/:jobId" element={<Chat />} />
            <Route path="/ai" element={<AIChat user={currentUser} />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/camera" element={<Camera />} />
            <Route path="/job/:jobId" element={<JobDetails user={currentUser} />} />
            <Route path="/post-job" element={<PostJob user={currentUser} />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/db" element={<DatabaseAdmin />} />
          </Routes>
        </main>

        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <PolicyModal isOpen={showPolicy} onAccept={handleAcceptPolicy} />

        {/* Bottom Navigation */}
        {!location.pathname.startsWith('/admin') && (
          <nav className={cn(
            "fixed bottom-0 left-0 right-0 px-1 sm:px-2 py-2 sm:py-3 flex justify-around sm:justify-between items-center z-50 transition-colors",
            theme === 'dark' ? "glass" : "glass-light border-t border-neutral-200"
          )}>
            <NavLink to="/" icon={<Home size={18} className="sm:w-5 sm:h-5" />} label="Home" />
            <NavLink to="/jobs" icon={<Briefcase size={18} className="sm:w-5 sm:h-5" />} label="Jobs" />
            <NavLink to="/market" icon={<Package size={18} className="sm:w-5 sm:h-5" />} label="Market" />
            <NavLink to="/wallet" icon={<Wallet size={18} className="sm:w-5 sm:h-5" />} label="Wallet" />
            <NavLink to="/talent" icon={<Users size={18} className="sm:w-5 sm:h-5" />} label="Talent" />
            <NavLink to="/ai" icon={<Bot size={18} className="sm:w-5 sm:h-5" />} label="AI" />
            <NavLink to="/profile" icon={<User size={18} className="sm:w-5 sm:h-5" />} label="Profile" />
          </nav>
        )}
      </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const { theme } = useTheme();
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-0.5 sm:gap-1 transition-colors px-1 sm:px-2",
        isActive 
          ? (theme === 'dark' ? "text-emerald-400" : "text-emerald-600") 
          : (theme === 'dark' ? "text-neutral-600 hover:text-neutral-400" : "text-neutral-400 hover:text-neutral-600")
      )}
    >
      {icon}
      <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </Link>
  );
}

