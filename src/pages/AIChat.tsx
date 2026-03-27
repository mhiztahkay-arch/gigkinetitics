import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../lib/ThemeContext';
import { chatWithAI } from '../lib/ai';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AIChat({ user }: { user: any }) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "How far! I be GigKinetics AI. I fit help you find gigs, manage your money, or show you how this app work. Wetin dey occur?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (content: string = input) => {
    if (!content.trim()) return;
    if (isLoading) return;

    const userMsg = content;
    setInput('');
    
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Prepare history for Gemini (excluding the last message we just added)
      const history = messages.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // Call Gemini directly from frontend
      const aiContent = await chatWithAI(userMsg, history, {
        userName: user?.name,
        userRole: user?.role,
        userBalance: user?.balance
      });

      setMessages(prev => [...prev, { role: 'ai', content: aiContent || "Omo, I no fit process that one. Abeg try again." }]);
    } catch (error: any) {
      console.error('AI Error:', error);
      const errorMsg = error.message?.includes("API key") 
        ? "Omo, Gemini API key no dey configured. Abeg check your settings."
        : "Omo, network don fall. Abeg check your connection and try again.";
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto w-full ${theme === 'dark' ? 'bg-black' : 'bg-neutral-50'}`}>
      {/* Chat Header */}
      <div className={`p-4 flex items-center gap-3 sticky top-0 z-10 rounded-b-3xl border-b transition-colors ${
        theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Bot size={28} />
        </div>
        <div>
          <h2 className={`font-black text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>GigKinetics AI</h2>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
            <Sparkles size={10} className="animate-pulse" />
            <span>Online & Ready</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  msg.role === 'user' ? 'bg-emerald-600' : (theme === 'dark' ? 'bg-neutral-800 border border-white/10' : 'bg-white border border-neutral-200')
                }`}>
                  {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-emerald-500" />}
                </div>
                <div className={`p-5 rounded-[32px] shadow-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : (theme === 'dark' ? 'glass text-neutral-200 rounded-tl-none border border-white/5' : 'bg-white text-neutral-800 rounded-tl-none border border-neutral-100')
                }`}>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-neutral-800 border border-white/10' : 'bg-white border border-neutral-200'}`}>
                <Bot size={20} className="text-emerald-500" />
              </div>
              <div className={`p-5 rounded-[32px] rounded-tl-none border ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-100'}`}>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-6 border-t rounded-t-[40px] transition-colors ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border-neutral-200 shadow-2xl'}`}>
        <div className="flex gap-3 max-w-3xl mx-auto items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything sharp sharp..."
              className={`w-full border rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                theme === 'dark' ? 'bg-neutral-900 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
              }`}
            />
          </div>
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}
