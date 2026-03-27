import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, UserPlus, Mail, Lock, Chrome, Eye, EyeOff, ArrowLeft, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords no match, boss. Check am well.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Check your email, we don send reset link!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (currentUser && onLoginSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8 glass p-10 rounded-[40px] shadow-2xl border border-white/10 backdrop-blur-3xl text-center"
        >
          <div className="space-y-6">
            <div className="relative mx-auto w-24 h-24">
              <img 
                src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.displayName || currentUser.email}`} 
                className="w-full h-full rounded-[32px] border-4 border-emerald-500 shadow-2xl"
                alt="avatar"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-full text-white shadow-lg">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Welcome back, {currentUser.displayName?.split(' ')[0] || 'Boss'}!</h2>
              <p className="text-neutral-400 text-sm font-medium">You are already signed in as <br/><span className="text-emerald-500">{currentUser.email}</span></p>
            </div>
            
            <div className="space-y-4 pt-4">
              <button
                onClick={() => onLoginSuccess()}
                className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest"
              >
                Continue to App
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => auth.signOut()}
                className="w-full glass py-4 rounded-2xl text-neutral-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Switch Account
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8 glass p-10 rounded-[40px] shadow-2xl border border-white/10 backdrop-blur-3xl"
        >
          <button 
            onClick={() => setIsForgotPassword(false)}
            className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>

          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-600/20 rounded-[24px] flex items-center justify-center text-blue-500 mx-auto shadow-xl shadow-blue-600/10">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Forgot Password?</h1>
            <p className="text-neutral-400 text-sm">No wahala, just enter your email and we go send you reset link.</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest ml-1">{error}</p>}
            {message && <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest ml-1">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 glass p-10 rounded-[40px] shadow-2xl border border-white/10 backdrop-blur-3xl"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-[24px] flex items-center justify-center text-white font-black text-4xl mx-auto shadow-2xl shadow-emerald-500/20">G</div>
          <h1 className="text-4xl font-black tracking-tighter text-white">GIG<span className="text-emerald-500">KINETICS</span></h1>
          <p className="text-neutral-400 text-sm font-medium">{isLogin ? 'Welcome back, boss!' : 'Join the elite Nigerian workforce'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Password</label>
              {isLogin && (
                <button 
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:text-emerald-400"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-14 py-5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </motion.div>
          )}

          {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest ml-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn size={20} />
                Sign In Sharp Sharp
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
            <span className="bg-neutral-950 px-4 text-neutral-600">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full glass py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-white hover:bg-white/5 transition-all uppercase tracking-widest text-xs"
        >
          <Chrome size={20} className="text-blue-400" />
          Google Account
        </button>

        <p className="text-center text-xs font-bold uppercase tracking-widest text-neutral-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
            }}
            className="text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
