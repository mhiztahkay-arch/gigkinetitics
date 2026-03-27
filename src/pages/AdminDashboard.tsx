import { useState, useEffect } from 'react';
import { 
  Shield, DollarSign, Users, Briefcase, 
  AlertTriangle, TrendingUp, Activity, 
  Lock, Unlock, Eye, Download, Search,
  Filter, CheckCircle2, XCircle, Clock,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  PieChart, BarChart3, History, Settings,
  ShieldCheck, UserPlus, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [commissionStats, setCommissionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState('');
  const [currentLayer, setCurrentLayer] = useState(1);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('support_admin');
  const [systemSettings, setSystemSettings] = useState<any>({});
  const [showPinPrompt, setShowPinPrompt] = useState<any>(null); // { key, value }
  const [pinInput, setPinInput] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { headers: { 'x-user-id': dbUser.id } });
      if (res.ok) setSystemSettings(await res.json());
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  };

  const verifyAdminPassword = async () => {
    if (!adminPassword) {
      setAuthError(`Please enter layer ${currentLayer} password`);
      return;
    }
    setIsVerifying(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': dbUser.id 
        },
        body: JSON.stringify({ password: adminPassword, layer: currentLayer })
      });
      if (res.ok) {
        if (currentLayer < 3) {
          setCurrentLayer(prev => prev + 1);
          setAdminPassword('');
          setAuthError('');
        } else {
          setIsAdminAuthenticated(true);
        }
      } else {
        const data = await res.json();
        setAuthError(data.error || `Invalid layer ${currentLayer} password`);
      }
    } catch (error) {
      console.error('Auth error', error);
      setAuthError('Connection failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string, pin: string) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': dbUser.id 
        },
        body: JSON.stringify({ key, value, pin })
      });
      if (res.ok) {
        alert('Setting updated successfully');
        fetchSettings();
        setShowPinPrompt(null);
        setPinInput('');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update setting');
      }
    } catch (error) {
      console.error('Update error', error);
    }
  };

  const handleInitialSetup = async () => {
    if (!adminPassword) {
      setAuthError('Please set a password');
      return;
    }
    setIsVerifying(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': dbUser.id },
        body: JSON.stringify({ password: adminPassword })
      });
      if (res.ok) {
        setNeedsPasswordSetup(false);
        setIsAdminAuthenticated(true);
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Failed to set password');
      }
    } catch (error) {
      console.error('Setup error', error);
      setAuthError('Connection failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddAdmin = async () => {
    try {
      const res = await fetch('/api/admin/whitelist/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': dbUser.id 
        },
        body: JSON.stringify({ email: newAdminEmail, role: newAdminRole })
      });
      if (res.ok) {
        alert('Admin added to whitelist');
        setShowAddAdmin(false);
        setNewAdminEmail('');
      }
    } catch (error) {
      console.error('Add admin error', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions', { headers: { 'x-user-id': dbUser.id } });
      if (res.ok) setTransactions(await res.json());
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    }
  };

  const fetchEscrows = async () => {
    try {
      const res = await fetch('/api/admin/escrows', { headers: { 'x-user-id': dbUser.id } });
      if (res.ok) setEscrows(await res.json());
    } catch (error) {
      console.error('Failed to fetch escrows', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals', { headers: { 'x-user-id': dbUser.id } });
      if (res.ok) setWithdrawals(await res.json());
    } catch (error) {
      console.error('Failed to fetch withdrawals', error);
    }
  };

  const fetchRiskAlerts = async () => {
    try {
      const res = await fetch('/api/admin/risk/alerts', { headers: { 'x-user-id': dbUser.id } });
      if (res.ok) setRiskAlerts(await res.json());
    } catch (error) {
      console.error('Failed to fetch risk alerts', error);
    }
  };

  const fetchCommissionStats = async () => {
    try {
      const res = await fetch('/api/admin/commission/stats', { headers: { 'x-user-id': dbUser.id } });
      if (res.ok) setCommissionStats(await res.json());
    } catch (error) {
      console.error('Failed to fetch commission stats', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'financials') {
      fetchTransactions();
      fetchCommissionStats();
    }
    if (activeTab === 'escrow') fetchEscrows();
    if (activeTab === 'risk') fetchRiskAlerts();
    if (activeTab === 'financials' || activeTab === 'overview') fetchWithdrawals();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    if (!window.confirm('Approve this withdrawal? Funds will be sent via Monnify.')) return;
    try {
      const res = await fetch('/api/admin/withdrawals/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': dbUser.id 
        },
        body: JSON.stringify({ withdrawalId, adminId: dbUser.id })
      });
      if (res.ok) {
        alert('Withdrawal approved and processed');
        fetchWithdrawals();
        fetchData();
      }
    } catch (error) {
      console.error('Failed to approve withdrawal', error);
    }
  };

  const handleReleaseEscrow = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to manually release these funds? This action is irreversible.')) return;
    try {
      const res = await fetch('/api/escrow/release-fund', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': dbUser.id 
        },
        body: JSON.stringify({ jobId, adminId: dbUser.id })
      });
      if (res.ok) {
        alert('Funds released successfully');
        fetchEscrows();
        fetchData();
      }
    } catch (error) {
      console.error('Failed to release escrow', error);
    }
  };

  useEffect(() => {
    if (!dbUser?.is_admin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [dbUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes, authCheckRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { headers: { 'x-user-id': dbUser.id } }),
        fetch('/api/admin/users', { headers: { 'x-user-id': dbUser.id } }),
        fetch('/api/admin/audit-logs', { headers: { 'x-user-id': dbUser.id } }),
        fetch('/api/admin/auth/check', { headers: { 'x-user-id': dbUser.id } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (logsRes.ok) setAuditLogs(await logsRes.json());
      if (authCheckRes.ok) {
        const { hasPassword } = await authCheckRes.json();
        setNeedsPasswordSetup(!hasPassword);
      }
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/risk/resolve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': dbUser.id 
        },
        body: JSON.stringify({ alertId, status })
      });
      if (res.ok) {
        alert('Alert resolved');
        fetchRiskAlerts();
      }
    } catch (error) {
      console.error('Resolve error', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-10 rounded-[40px] glass border border-white/10 text-center space-y-8"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto text-emerald-500">
            <Shield size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {needsPasswordSetup ? 'Initial Admin Setup' : `Admin Authentication (Layer ${currentLayer}/3)`}
            </h2>
            <p className="text-neutral-400 text-sm">
              {needsPasswordSetup 
                ? 'Set your secondary admin password to secure the command center.' 
                : `Enter layer ${currentLayer} password to proceed.`}
            </p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="password"
                placeholder={needsPasswordSetup ? 'Set New Admin Password' : `Layer ${currentLayer} Password`}
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAuthError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    needsPasswordSetup ? handleInitialSetup() : verifyAdminPassword();
                  }
                }}
                className={`w-full px-6 py-5 rounded-2xl bg-white/5 border ${authError ? 'border-red-500/50' : 'border-white/10'} text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center tracking-widest`}
              />
              {authError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2"
                >
                  {authError}
                </motion.p>
              )}
            </div>
            <button 
              disabled={isVerifying}
              onClick={needsPasswordSetup ? handleInitialSetup : verifyAdminPassword}
              className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3"
            >
              {isVerifying ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Shield size={18} />
              )}
              {needsPasswordSetup ? 'Initialize Security' : (currentLayer < 3 ? `Verify Layer ${currentLayer}` : 'Final Verification')}
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 text-neutral-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
            >
              Return to App
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#050505]' : 'bg-neutral-50'}`}>
      {/* Admin Sidebar */}
      <div className="flex h-screen overflow-hidden">
        <aside className={`w-64 hidden lg:flex flex-col border-r transition-colors ${
          theme === 'dark' ? 'bg-black border-white/5' : 'bg-white border-neutral-200'
        }`}>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Shield className="text-white" size={20} />
              </div>
              <span className={`font-black tracking-tighter text-xl ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                ADMIN<span className="text-emerald-500">CORE</span>
              </span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: PieChart },
                { id: 'financials', label: 'Financials', icon: DollarSign },
                { id: 'withdrawals', label: 'Withdrawal Governance', icon: ArrowUpRight },
                { id: 'users', label: 'User Control', icon: Users },
                { id: 'escrow', label: 'Escrow Governance', icon: Lock },
                { id: 'risk', label: 'Risk & Compliance', icon: AlertTriangle },
                { id: 'audit', label: 'Audit Logs', icon: History },
                { id: 'settings', label: 'System Config', icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === item.id 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                      : `text-neutral-500 hover:bg-white/5`
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="pt-8 border-t border-white/5 space-y-2">
              <button 
                onClick={() => navigate('/')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-neutral-500 hover:bg-white/5 hover:text-emerald-500 transition-all"
              >
                <ChevronRight size={16} className="rotate-180" />
                Go to Main App
              </button>
            </div>
          </div>

          <div className="mt-auto p-8 border-t border-white/5">
            <div className="flex items-center gap-3">
              <img src={dbUser.avatar_url} className="w-10 h-10 rounded-xl" alt="" />
              <div>
                <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{dbUser.name}</p>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{dbUser.admin_role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">GigKinetics Internal Control System</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                theme === 'dark' ? 'glass border-white/5 text-emerald-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                <Activity size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">System Live</span>
              </div>
              <button className={`p-2 rounded-xl transition-all ${
                theme === 'dark' ? 'glass text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}>
                <Download size={20} />
              </button>
            </div>
          </header>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { label: 'Total GMV', value: formatCurrency(stats?.gmv || 0), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Commission Revenue', value: formatCurrency(stats?.commission || 0), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'Active Escrow', value: formatCurrency(stats?.escrow || 0), icon: Lock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { label: 'Pending Payouts', value: withdrawals.filter(w => w.status === 'pending').length, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-6 rounded-[32px] border shadow-xl transition-colors ${
                      theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                      <stat.icon className={stat.color} size={24} />
                    </div>
                    <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                    <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{stat.value}</h2>
                  </motion.div>
                ))}
              </div>

              {/* System Observability */}
              <section className={`p-8 rounded-[40px] border shadow-xl transition-colors ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>System Observability</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Real-time Stream</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Monnify Webhooks</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-500">Healthy</span>
                      <span className="text-[10px] text-neutral-500">99.9% Success</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Reconciliation</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-500">Synced</span>
                      <span className="text-[10px] text-neutral-500">Last: 1m ago</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Escrow Exposure</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-500">Balanced</span>
                      <span className="text-[10px] text-neutral-500">₦0.00 Mismatch</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Activity & Risk Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className={`p-8 rounded-[40px] border shadow-xl transition-colors ${
                  theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Recent Audit Logs</h3>
                    <button onClick={() => setActiveTab('audit')} className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:underline">View All</button>
                  </div>
                  <div className="space-y-4">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                          <History size={14} className="text-neutral-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                            {log.admin_name} <span className="text-neutral-500 font-medium">performed</span> {log.action}
                          </p>
                          <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mt-1">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`p-8 rounded-[40px] border shadow-xl transition-colors ${
                  theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Risk Monitoring</h3>
                    <div className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">High Alert</div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { type: 'Escrow Bypass', user: 'Tunde F.', risk: 'High', time: '2m ago' },
                      { type: 'Abnormal Payout', user: 'Amina B.', risk: 'Medium', time: '15m ago' },
                      { type: 'Multiple Logins', user: 'Chidi O.', risk: 'Low', time: '1h ago' },
                    ].map((alert, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={16} className="text-red-500" />
                          <div>
                            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{alert.type}</p>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{alert.user}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${
                            alert.risk === 'High' ? 'text-red-500' : alert.risk === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                          }`}>{alert.risk}</p>
                          <p className="text-[10px] text-neutral-500 font-medium">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-8">
              <section className={`p-8 rounded-[40px] border shadow-xl transition-colors ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
              }`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Commission Revenue Control</h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Monnify-Secured Revenue Stream</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total Revenue</p>
                      <p className="text-xl font-black text-emerald-500">{formatCurrency(commissionStats?.total_revenue || 0)}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Platform Fee</p>
                    <h4 className="text-3xl font-black text-emerald-500">10%</h4>
                    <p className="text-[10px] text-neutral-500 font-medium mt-2">Fixed across all categories</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Avg. Commission</p>
                    <h4 className="text-3xl font-black text-blue-500">{formatCurrency(commissionStats?.avg_commission || 0)}</h4>
                    <p className="text-[10px] text-neutral-500 font-medium mt-2">Per successful transaction</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Total Volume</p>
                    <h4 className="text-3xl font-black text-purple-500">{commissionStats?.total_transactions || 0}</h4>
                    <p className="text-[10px] text-neutral-500 font-medium mt-2">Processed transactions</p>
                  </div>
                </div>
              </section>

              <section className={`p-8 rounded-[40px] border shadow-xl transition-colors ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
              }`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Revenue Projection Model</h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Simulate platform earnings based on GMV</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2 block">Projected Monthly GMV (₦)</label>
                      <input 
                        type="number" 
                        defaultValue={1000000}
                        onChange={(e) => {
                          const gmv = Number(e.target.value);
                          const rev = gmv * 0.10;
                          const el = document.getElementById('sim-revenue');
                          if (el) el.innerText = formatCurrency(rev);
                        }}
                        className={`w-full px-6 py-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                          theme === 'dark' ? 'bg-white/5 text-white border-white/10' : 'bg-neutral-50 text-neutral-900 border-neutral-200'
                        }`}
                      />
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Projected Commission (10%)</p>
                      <p id="sim-revenue" className="text-2xl font-black text-emerald-500">{formatCurrency(100000)}</p>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex flex-col justify-center">
                    <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                      This simulation uses the current fixed platform fee of 10%. 
                      Revenue is calculated as <span className="font-bold text-blue-500">GMV × 0.10</span>. 
                      Settlement cycles and Monnify processing fees are not included in this projection.
                    </p>
                  </div>
                </div>
              </section>

              <section className={`rounded-[40px] border shadow-xl overflow-hidden transition-colors ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
              }`}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Global Transaction Ledger</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Inflow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Outflow</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${
                      theme === 'dark' ? 'text-neutral-500 border-white/5' : 'text-neutral-400 border-neutral-100'
                    }`}>
                      <th className="px-8 py-6">Reference</th>
                      <th className="px-8 py-6">User</th>
                      <th className="px-8 py-6">Type</th>
                      <th className="px-8 py-6">Amount</th>
                      <th className="px-8 py-6">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{tx.monnify_reference || tx.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-neutral-500 font-medium">{tx.description}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-neutral-500 font-bold">{tx.user_name || 'System'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            tx.type.includes('release') || tx.type.includes('credit') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`text-sm font-bold ${
                            tx.type.includes('release') || tx.type.includes('credit') ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                            {tx.type.includes('release') || tx.type.includes('credit') ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-neutral-500 font-medium">{new Date(tx.created_at).toLocaleString()}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <section className={`rounded-[40px] border shadow-xl overflow-hidden transition-colors ${
              theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
            }`}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Withdrawal Governance Dashboard</h3>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Monnify Payout Engine</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${
                      theme === 'dark' ? 'text-neutral-500 border-white/5' : 'text-neutral-400 border-neutral-100'
                    }`}>
                      <th className="px-8 py-6">User</th>
                      <th className="px-8 py-6">Amount</th>
                      <th className="px-8 py-6">Bank Details</th>
                      <th className="px-8 py-6">Risk Score</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{w.user_name}</p>
                          <p className="text-[10px] text-neutral-500 font-medium">{w.user_email}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{formatCurrency(w.amount)}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-neutral-500 font-bold">{w.bank_name}</p>
                          <p className="text-[10px] text-neutral-500 font-medium">{w.account_number}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${
                            w.risk_score > 70 ? 'bg-red-500/10 text-red-500' : w.risk_score > 30 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            Score: {w.risk_score}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          {w.status === 'pending' && (
                            <button 
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'risk' && (
            <section className={`rounded-[40px] border shadow-xl overflow-hidden transition-colors ${
              theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
            }`}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Risk & Compliance Monitoring</h3>
                <div className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">Live Detection</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${
                      theme === 'dark' ? 'text-neutral-500 border-white/5' : 'text-neutral-400 border-neutral-100'
                    }`}>
                      <th className="px-8 py-6">Alert Type</th>
                      <th className="px-8 py-6">User</th>
                      <th className="px-8 py-6">Severity</th>
                      <th className="px-8 py-6">Message</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {riskAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-red-500" />
                            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{alert.type}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-neutral-500 font-bold">{alert.user_name}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            alert.severity === 'critical' ? 'bg-red-600 text-white' : alert.severity === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-neutral-500 font-medium max-w-xs truncate">{alert.message}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{alert.status}</span>
                        </td>
                        <td className="px-8 py-6">
                          {alert.status === 'open' && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleResolveAlert(alert.id, 'resolved')}
                                className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                              >
                                Resolve
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section className={`rounded-[40px] border shadow-xl overflow-hidden transition-colors ${
              theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
            }`}>
              <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search users by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-12 pr-6 py-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-white/5 text-white border-white/10' : 'bg-neutral-50 text-neutral-900 border-neutral-200'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAddAdmin(true)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                  >
                    <UserPlus size={14} />
                    Add Admin
                  </button>
                  <button className={`px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                    theme === 'dark' ? 'glass text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  }`}>
                    <Filter size={14} />
                    Filter
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${
                      theme === 'dark' ? 'text-neutral-500 border-white/5' : 'text-neutral-400 border-neutral-100'
                    }`}>
                      <th className="px-8 py-6">User</th>
                      <th className="px-8 py-6">Role</th>
                      <th className="px-8 py-6">Balance</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                      <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-10 h-10 rounded-xl" alt="" />
                            <div>
                              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{user.name}</p>
                              <p className="text-[10px] text-neutral-500 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            user.is_admin ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {user.admin_role || user.role}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{formatCurrency(user.balance)}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Active</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 glass rounded-lg text-neutral-400 hover:text-emerald-500 transition-colors">
                              <Eye size={16} />
                            </button>
                            <button className="p-2 glass rounded-lg text-neutral-400 hover:text-red-500 transition-colors">
                              <Lock size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'escrow' && (
            <section className={`rounded-[40px] border shadow-xl overflow-hidden transition-colors ${
              theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
            }`}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Active Escrow Holdings</h3>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Monnify Secured</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${
                      theme === 'dark' ? 'text-neutral-500 border-white/5' : 'text-neutral-400 border-neutral-100'
                    }`}>
                      <th className="px-8 py-6">Job</th>
                      <th className="px-8 py-6">Client</th>
                      <th className="px-8 py-6">Provider</th>
                      <th className="px-8 py-6">Amount</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {escrows.map((escrow) => (
                      <tr key={escrow.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{escrow.job_title}</p>
                          <p className="text-[10px] text-neutral-500 font-medium">{escrow.monnify_reference}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-neutral-500 font-bold">{escrow.client_name}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-neutral-500 font-bold">{escrow.provider_name}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{formatCurrency(escrow.amount)}</p>
                          <p className="text-[10px] text-emerald-500 font-bold">Fee: {formatCurrency(escrow.commission_amount)}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {escrow.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => handleReleaseEscrow(escrow.job_id)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                          >
                            Release
                          </button>
                        </td>
                      </tr>
                    ))}
                    {escrows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-neutral-500 text-xs font-bold uppercase tracking-widest">
                          No active escrow holdings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'audit' && (
            <section className={`rounded-[40px] border shadow-xl overflow-hidden transition-colors ${
              theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
            }`}>
              <div className="p-8 border-b border-white/5">
                <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Immutable Audit Trail</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${
                      theme === 'dark' ? 'text-neutral-500 border-white/5' : 'text-neutral-400 border-neutral-100'
                    }`}>
                      <th className="px-8 py-6">Admin</th>
                      <th className="px-8 py-6">Action</th>
                      <th className="px-8 py-6">Resource</th>
                      <th className="px-8 py-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{log.admin_name}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-500">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-neutral-500 font-medium">{log.resource} <span className="text-[10px] opacity-50">#{log.resource_id}</span></p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-neutral-500 font-medium">{new Date(log.created_at).toLocaleString()}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <section className={`p-8 rounded-[40px] border shadow-xl transition-colors ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
              }`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Core System Configuration</h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Manage platform-wide parameters and security</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Platform Fee */}
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Platform Fee (%)</p>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Current: {systemSettings.platform_fee}%</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowPinPrompt({ key: 'platform_fee', value: '' })}
                        className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Security PIN */}
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                          <Lock size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Withdrawal Lock PIN</p>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Master security override</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowPinPrompt({ key: 'withdrawal_lock_pin', value: '' })}
                        className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className={`p-8 rounded-[40px] border shadow-xl transition-colors ${
                theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200'
              }`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Admin Profile Security</h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Update your secondary admin password</p>
                  </div>
                </div>
                <div className="max-w-md space-y-4">
                  <input 
                    type="password"
                    placeholder="New Admin Password"
                    id="new-admin-password"
                    className={`w-full px-6 py-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-white/5 text-white border-white/10' : 'bg-neutral-50 text-neutral-900 border-neutral-200'
                    }`}
                  />
                  <button 
                    onClick={async () => {
                      const pwd = (document.getElementById('new-admin-password') as HTMLInputElement).value;
                      if (!pwd) return;
                      const res = await fetch('/api/admin/auth/set-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-user-id': dbUser.id },
                        body: JSON.stringify({ password: pwd })
                      });
                      if (res.ok) alert('Admin password updated');
                    }}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                  >
                    Save Password
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
      {/* Modals */}
      <AnimatePresence>
        {showAddAdmin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-10 rounded-[40px] glass border border-white/10 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white tracking-tight">Add New Admin</h3>
                <button onClick={() => setShowAddAdmin(false)} className="text-neutral-500 hover:text-white"><XCircle size={24} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="admin@gigkinetics.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest ml-1">Admin Role</label>
                  <select 
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="finance_admin">Finance Admin</option>
                    <option value="risk_admin">Risk Admin</option>
                    <option value="support_admin">Support Admin</option>
                  </select>
                </div>
                <button 
                  onClick={handleAddAdmin}
                  className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Whitelist Admin
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPinPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-10 rounded-[40px] glass border border-white/10 space-y-8 text-center"
            >
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                <Lock size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">Security Verification</h3>
                <p className="text-neutral-400 text-sm">Enter the Master Security PIN to modify this core system setting.</p>
              </div>
              <div className="space-y-4">
                <input 
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-center text-2xl font-black tracking-[1em] outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  placeholder="••••"
                />
                {showPinPrompt.key === 'platform_fee' && (
                  <input 
                    type="number"
                    placeholder="New Fee %"
                    onChange={(e) => setShowPinPrompt({ ...showPinPrompt, value: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                )}
                {showPinPrompt.key === 'withdrawal_lock_pin' && (
                  <input 
                    type="password"
                    maxLength={4}
                    placeholder="New Master PIN"
                    onChange={(e) => setShowPinPrompt({ ...showPinPrompt, value: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                )}
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setShowPinPrompt(null); setPinInput(''); }}
                    className="flex-1 py-4 glass text-neutral-400 font-bold text-xs uppercase tracking-widest rounded-2xl hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleUpdateSetting(showPinPrompt.key, showPinPrompt.value, pinInput)}
                    className="flex-1 py-4 bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-700 shadow-lg shadow-amber-600/20"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
