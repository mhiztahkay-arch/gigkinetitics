import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Sparkles } from 'lucide-react';

const STEPS = [
  {
    title: "Welcome to GigKinetics! 🇳🇬",
    description: "The #1 platform for Nigerian freelancers and clients to connect, collaborate, and grow.",
    image: "https://picsum.photos/seed/welcome/400/300"
  },
  {
    title: "The Marketplace (Gigs)",
    description: "Buy and sell fixed-price services 'sharp sharp'. No long grammar, just results.",
    image: "https://picsum.photos/seed/market/400/300"
  },
  {
    title: "LinkedIn-style Feed",
    description: "Stay connected with other professionals. Share updates, find talent, and build your network.",
    image: "https://picsum.photos/seed/feed/400/300"
  },
  {
    title: "Secure Escrow",
    description: "Your money is safe with us. We hold payments until the job is done and everyone is happy.",
    image: "https://picsum.photos/seed/escrow/400/300"
  }
];

export default function Walkthrough({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="relative h-48 overflow-hidden">
          <img 
            src={STEPS[currentStep].image} 
            alt="step" 
            className="w-full h-full object-cover"
          />
          <button 
            onClick={onComplete}
            className="absolute top-4 right-4 p-2 glass rounded-full text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">{STEPS[currentStep].title}</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {STEPS[currentStep].description}
            </p>
          </div>

          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-emerald-500' : 'w-1.5 bg-white/10'
                }`} 
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all group"
          >
            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
