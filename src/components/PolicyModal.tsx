import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Check, X } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

interface PolicyModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export default function PolicyModal({ isOpen, onAccept }: PolicyModalProps) {
  const { theme } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`w-full max-w-lg rounded-[40px] p-10 space-y-8 border shadow-2xl ${
              theme === 'dark' ? 'glass border-white/10' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
              <Shield size={40} />
            </div>

            <div className="text-center space-y-4">
              <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                Privacy & Terms
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Welcome to GigKinetics! Before you start, please review and accept our Privacy Policy and Terms of Service. We take your data security seriously.
              </p>
            </div>

            <div className={`p-6 rounded-3xl space-y-4 max-h-60 overflow-y-auto text-xs leading-relaxed ${
              theme === 'dark' ? 'bg-white/5 text-neutral-400' : 'bg-neutral-50 text-neutral-600'
            }`}>
              <h4 className="font-bold text-emerald-500 uppercase tracking-widest">1. Data Collection</h4>
              <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with other users.</p>
              
              <h4 className="font-bold text-emerald-500 uppercase tracking-widest">2. Usage of Data</h4>
              <p>Your data is used to provide and improve our services, facilitate transactions, and ensure platform security.</p>
              
              <h4 className="font-bold text-emerald-500 uppercase tracking-widest">3. Payments & Escrow</h4>
              <p>All payments are handled through our secure escrow system. GigKinetics charges a 10% commission on all successful transactions.</p>
              
              <h4 className="font-bold text-emerald-500 uppercase tracking-widest">4. User Conduct</h4>
              <p>Users must maintain professional conduct. Any attempt to bypass the platform's payment system may lead to account suspension.</p>
            </div>

            <button
              onClick={onAccept}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check size={20} />
              I Accept & Agree
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
