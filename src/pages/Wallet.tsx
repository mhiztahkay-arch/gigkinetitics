import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Smartphone, 
  Zap, 
  Tv, 
  Wifi, 
  Plus, 
  Send, 
  History,
  Search,
  ChevronRight,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';

export default function Wallet() {
  const { dbUser, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState<string | null>(null);
  const [transferData, setTransferData] = useState({ mobile: '', amount: '', note: '' });
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawData, setWithdrawData] = useState({ amount: '', bank: '', account: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (dbUser) {
      fetchTransactions();
    }
  }, [dbUser]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/banking/transactions/${dbUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferData.mobile || !transferData.amount) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/banking/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: dbUser.id,
          recipientMobile: transferData.mobile,
          amount: parseInt(transferData.amount),
          description: transferData.note || 'GigKinetics Transfer'
        })
      });

      if (res.ok) {
        alert('Transfer successful! Omo, you be big man.');
        setShowTransferModal(false);
        setTransferData({ mobile: '', amount: '', note: '' });
        fetchTransactions();
        refreshUser();
      } else {
        const err = await res.json();
        alert(err.error || 'Transfer failed');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/banking/monnify/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dbUser.id,
          amount: parseInt(topUpAmount),
          email: dbUser.email,
          name: dbUser.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Monnify checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          alert('Failed to get checkout URL');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to initialize payment');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawData.amount || !withdrawData.bank || !withdrawData.account) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/banking/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dbUser.id,
          amount: parseInt(withdrawData.amount),
          bankName: withdrawData.bank,
          accountNumber: withdrawData.account
        })
      });

      if (res.ok) {
        alert('Withdrawal request sent! Expect alert sharp sharp.');
        setShowWithdrawModal(false);
        setWithdrawData({ amount: '', bank: '', account: '' });
        fetchTransactions();
        refreshUser();
      } else {
        const err = await res.json();
        alert(err.error || 'Withdrawal failed');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayBill = async (billType: string, amount: string, description: string) => {
    if (!amount) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/banking/pay-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dbUser.id,
          amount: parseInt(amount),
          billType,
          description
        })
      });

      if (res.ok) {
        alert(`${billType} payment successful! No wahala.`);
        setShowBillModal(null);
        fetchTransactions();
        refreshUser();
      } else {
        const err = await res.json();
        alert(err.error || 'Payment failed');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickActions = [
    { icon: <ArrowUpRight size={24} />, label: 'Transfer', color: 'bg-blue-500', onClick: () => setShowTransferModal(true) },
    { icon: <Plus size={24} />, label: 'Add Money', color: 'bg-emerald-500', onClick: () => setShowTopUpModal(true) },
    { icon: <History size={24} />, label: 'History', color: 'bg-amber-500', onClick: () => {} },
    { icon: <CreditCard size={24} />, label: 'Cards', color: 'bg-purple-500', onClick: () => {} },
  ];

  const bills = [
    { icon: <Smartphone size={20} />, label: 'Airtime', color: 'text-blue-500' },
    { icon: <Wifi size={20} />, label: 'Data', color: 'text-emerald-500' },
    { icon: <Zap size={20} />, label: 'Electricity', color: 'text-amber-500' },
    { icon: <Tv size={20} />, label: 'TV', color: 'text-purple-500' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>My Wallet</h2>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Manage your funds sharp sharp</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'glass' : 'bg-white shadow-sm'}`}>
          <ShieldCheck size={20} className="text-emerald-500" />
        </div>
      </header>

      {/* Balance Card - OPay Style */}
      <div className="relative overflow-hidden rounded-[40px] bg-emerald-600 p-8 text-white shadow-2xl shadow-emerald-600/20">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Total Balance</span>
            <WalletIcon size={20} className="opacity-80" />
          </div>
          <div className="space-y-1">
            <h3 className="text-4xl font-black tracking-tighter">₦{dbUser?.balance?.toLocaleString() || '0'}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Account: {dbUser?.mobile_number || 'Not Set'}</p>
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="flex-1 bg-white/20 backdrop-blur-md py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/30 transition-all"
            >
              Withdraw
            </button>
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="flex-1 bg-white text-emerald-600 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-all"
            >
              Top Up
            </button>
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {quickActions.map((action, i) => (
          <button 
            key={i} 
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all`}>
              {action.icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Bill Payments */}
      <div className={`rounded-[32px] p-6 space-y-6 ${theme === 'dark' ? 'glass' : 'bg-white shadow-sm border border-neutral-100'}`}>
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Pay Bills</h4>
          <button className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">View All</button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {bills.map((bill, i) => (
            <button 
              key={i} 
              onClick={() => setShowBillModal(bill.label)}
              className="flex flex-col items-center gap-3"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-neutral-50'} ${bill.color}`}>
                {bill.icon}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {bill.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Recent Transactions</h4>
          <Search size={16} className="text-neutral-500" />
        </div>
        
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className={`h-20 rounded-3xl animate-pulse ${theme === 'dark' ? 'glass' : 'bg-neutral-100'}`} />)
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <p className="text-xs font-bold uppercase tracking-widest">No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div 
                key={tx.id}
                className={`flex items-center justify-between p-4 rounded-3xl transition-all hover:scale-[1.02] ${
                  theme === 'dark' ? 'glass' : 'bg-white shadow-sm border border-neutral-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    tx.type.includes('in') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {tx.type.includes('in') ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                      {tx.description}
                    </p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      {new Date(tx.created_at).toLocaleDateString()} • {tx.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type.includes('in') ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.type.includes('in') ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Completed</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
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
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Transfer Money</h3>
                <button onClick={() => setShowTransferModal(false)} className="p-2 glass rounded-xl text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Recipient Mobile Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="08144990299"
                      value={transferData.mobile}
                      onChange={(e) => setTransferData({...transferData, mobile: e.target.value})}
                      className={`w-full border rounded-2xl pl-12 pr-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Amount (₦)</label>
                  <input 
                    type="number" 
                    placeholder="1000"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Note (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="For that gig..."
                    value={transferData.note}
                    onChange={(e) => setTransferData({...transferData, note: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
              </div>

              <button 
                onClick={handleTransfer}
                disabled={isProcessing}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    <Send size={18} />
                    Send Money Sharp Sharp
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Up Modal */}
      <AnimatePresence>
        {showTopUpModal && (
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
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Top Up Wallet</h3>
                <button onClick={() => setShowTopUpModal(false)} className="p-2 glass rounded-xl text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Amount to Add (₦)</label>
                  <input 
                    type="number" 
                    placeholder="5000"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
                
                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-neutral-50 border-neutral-100'}`}>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Payment Method</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Paystack / Flutterwave</p>
                      <p className="text-[10px] text-neutral-500">Secure card payment</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleTopUp}
                disabled={isProcessing}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing...' : 'Fund Wallet Sharp Sharp'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
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
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Withdraw Funds</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="p-2 glass rounded-xl text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Amount (₦)</label>
                  <input 
                    type="number" 
                    placeholder="1000"
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Select Bank</label>
                  <select 
                    value={withdrawData.bank}
                    onChange={(e) => setWithdrawData({...withdrawData, bank: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  >
                    <option value="">Choose Bank</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="GTBank">GTBank</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                    <option value="OPay">OPay</option>
                    <option value="Kuda Bank">Kuda Bank</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Account Number</label>
                  <input 
                    type="text" 
                    placeholder="0123456789"
                    value={withdrawData.account}
                    onChange={(e) => setWithdrawData({...withdrawData, account: e.target.value})}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
              </div>

              <button 
                onClick={handleWithdraw}
                disabled={isProcessing}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing...' : 'Withdraw Sharp Sharp'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bill Payment Modal */}
      <AnimatePresence>
        {showBillModal && (
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
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{showBillModal} Payment</h3>
                <button onClick={() => setShowBillModal(null)} className="p-2 glass rounded-xl text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Amount (₦)</label>
                  <input 
                    type="number" 
                    placeholder="2000"
                    id="billAmount"
                    className={`w-full border rounded-2xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    {showBillModal === 'Airtime' || showBillModal === 'Data' ? 'Phone Number' : 'Meter / Account Number'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="E.g. 08144990299"
                    id="billDescription"
                    className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  const amount = (document.getElementById('billAmount') as HTMLInputElement).value;
                  const desc = (document.getElementById('billDescription') as HTMLInputElement).value;
                  handlePayBill(showBillModal, amount, desc);
                }}
                disabled={isProcessing}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing...' : `Pay ${showBillModal} Sharp Sharp`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
