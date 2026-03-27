import { useState, useEffect } from 'react';
import { Lock, Delete, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PinLockProps {
  correctPin: string;
  onSuccess: () => void;
}

export default function PinLock({ correctPin, onSuccess }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 1000);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 max-w-xs w-full"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
            <Lock size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Security Lock</h2>
            <p className="text-neutral-500 text-sm">Enter your 4-digit PIN to continue</p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                error ? 'bg-red-500 border-red-500 animate-shake' :
                pin.length >= i ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-neutral-700'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num)}
              className="w-16 h-16 rounded-full glass flex items-center justify-center text-xl font-bold text-white hover:bg-white/10 active:scale-90 transition-all"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleNumber('0')}
            className="w-16 h-16 rounded-full glass flex items-center justify-center text-xl font-bold text-white hover:bg-white/10 active:scale-90 transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
          >
            <Delete size={24} />
          </button>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-xs font-bold uppercase tracking-widest"
          >
            Incorrect PIN. Try again.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
