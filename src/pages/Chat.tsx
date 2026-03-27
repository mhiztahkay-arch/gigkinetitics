import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Send, ChevronLeft, Phone, Video, Info, Mic, MicOff, Camera, X, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { interpretText } from '../lib/ai';

interface Message {
  id?: number;
  job_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type?: 'text' | 'voice' | 'video_call' | 'audio_call';
}

export default function Chat() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user: authUser, dbUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);
  const [job, setJob] = useState<any>(null);
  const [interpretingMsg, setInterpretingMsg] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Fetch job details
    fetch(`/api/jobs`)
      .then(res => res.json())
      .then(data => {
        const currentJob = data.find((j: any) => j.id === jobId);
        setJob(currentJob);
      });

    // Fetch existing messages
    fetch(`/api/jobs/${jobId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data));

    // Setup socket
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);

    newSocket.emit('join_job', jobId);

    newSocket.on('receive_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [jobId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (type: 'text' | 'voice' = 'text', content: string = input) => {
    if (!content.trim() && type === 'text') return;
    if (!socket || !authUser) return;

    const messageData = {
      jobId,
      senderId: authUser.uid,
      content,
      type
    };

    socket.emit('send_message', messageData);
    if (type === 'text') setInput('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        // In a real app, we'd upload this to a server/S3
        handleSend('voice', 'Voice message sent');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const releaseEscrow = async () => {
    if (!window.confirm("Are you sure you want to release the funds to the provider?")) return;
    try {
      const res = await fetch('/api/escrow/release-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      if (res.ok) {
        alert("Funds released sharp sharp! Business closed.");
        handleSend('text', '🎉 Funds have been released from escrow!');
      }
    } catch (err) {
      console.error("Failed to release escrow", err);
    }
  };

  const handleInterpretMessage = async (msgId: number, text: string) => {
    if (!msgId) return;
    setInterpretingMsg(msgId);
    try {
      const interpreted = await interpretText(
        text, 
        dbUser?.preferred_language || 'English', 
        dbUser?.comm_style || 'informal'
      );
      if (interpreted) {
        setMessages(messages.map(m => m.id === msgId ? { ...m, content: interpreted } : m));
      }
    } catch (error) {
      console.error('Interpretation failed', error);
    } finally {
      setInterpretingMsg(null);
    }
  };

  return (
    <div className={`flex flex-col h-screen max-w-2xl mx-auto ${theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#efeae2]'}`}>
      {/* WhatsApp Style Header */}
      <header className={`p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm ${
        theme === 'dark' ? 'bg-[#202c33] text-white' : 'bg-[#008069] text-white'
      }`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-800 border border-white/10">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${jobId || 'chat'}`} 
              alt="avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight truncate max-w-[150px]">{job?.title || 'Chat'}</h2>
            <p className="text-[10px] opacity-70 font-medium">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveCall('video')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Video size={20} /></button>
          <button onClick={() => setActiveCall('audio')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Phone size={20} /></button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><MoreVertical size={20} /></button>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === authUser?.uid;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] px-3 py-2 rounded-xl shadow-sm relative group ${
                isMe 
                  ? (theme === 'dark' ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#dcf8c6] text-[#303030]') 
                  : (theme === 'dark' ? 'bg-[#202c33] text-[#e9edef]' : 'bg-white text-[#303030]')
              }`}>
                {/* Message Content */}
                <div className="text-sm leading-relaxed pr-8">
                  {msg.type === 'voice' ? (
                    <div className="flex items-center gap-3 py-1 min-w-[150px]">
                      <Mic size={16} className={isMe ? 'text-blue-200' : 'text-emerald-500'} />
                      <div className="flex-1 h-1 bg-black/10 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-emerald-500" />
                      </div>
                      <span className="text-[10px] font-bold opacity-60">0:04</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p>{msg.content}</p>
                      {!isMe && msg.id && (
                        <button 
                          onClick={() => handleInterpretMessage(msg.id!, msg.content)}
                          disabled={interpretingMsg === msg.id}
                          className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest hover:underline block"
                        >
                          {interpretingMsg === msg.id ? 'Interpreting...' : 'Interpret'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Timestamp & Status */}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[9px] opacity-60 font-medium">
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </span>
                  {isMe && <CheckCheck size={12} className="text-blue-400" />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Escrow Release Button for Clients */}
      {job?.client_id === authUser?.uid && job?.status === 'in_progress' && (
        <div className="px-4 py-2">
          <button 
            onClick={releaseEscrow}
            className="w-full bg-emerald-600 text-white py-3 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} />
            Release Funds to Provider
          </button>
        </div>
      )}

      {/* WhatsApp Style Input Area */}
      <div className={`p-2 flex items-end gap-2 ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-full ${theme === 'dark' ? 'bg-[#2a3942]' : 'bg-white'}`}>
          <button className="p-1 text-neutral-500 hover:text-blue-500 transition-colors"><Smile size={22} /></button>
          <button className="p-1 text-neutral-500 hover:text-blue-500 transition-colors"><Paperclip size={22} /></button>
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            className="flex-1 bg-transparent border-none outline-none text-sm py-1 resize-none max-h-32 no-scrollbar"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button onClick={() => navigate('/camera')} className="p-1 text-neutral-500 hover:text-blue-500 transition-colors"><Camera size={22} /></button>
        </div>
        
        <button 
          onClick={input.trim() ? () => handleSend() : (isRecording ? stopRecording : startRecording)}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90 ${
            input.trim() ? 'bg-[#00a884]' : (isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#00a884]')
          }`}
        >
          {input.trim() ? <Send size={20} /> : (isRecording ? <Square size={20} /> : <Mic size={20} />)}
        </button>
      </div>

      {/* Voice Recording Overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 right-4 glass p-4 rounded-3xl flex items-center justify-between z-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-bold uppercase tracking-widest text-red-500">Recording...</span>
            </div>
            <div className="flex gap-4">
              <button onClick={stopRecording} className="text-neutral-500 font-bold text-xs uppercase">Cancel</button>
              <button onClick={stopRecording} className="text-blue-500 font-bold text-xs uppercase">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call UI Overlay */}
      <AnimatePresence>
        {activeCall && (
          <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 space-y-12">
            <div className="relative">
              <div className="w-40 h-40 rounded-[40px] overflow-hidden border-4 border-emerald-500 animate-pulse shadow-2xl shadow-emerald-500/50">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${jobId}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-600 p-4 rounded-3xl text-white shadow-xl">
                {activeCall === 'video' ? <Video size={24} /> : <Phone size={24} />}
              </div>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tight">{job?.title}</h2>
              <p className="text-emerald-400 font-black animate-pulse uppercase tracking-widest text-sm">
                {activeCall === 'video' ? 'Video Calling...' : 'Audio Calling...'}
              </p>
            </div>
            <div className="flex gap-12">
              <button 
                onClick={() => setActiveCall(null)}
                className="w-20 h-20 bg-red-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-red-600/40 hover:scale-110 active:scale-90 transition-all"
              >
                <X size={36} />
              </button>
              <button className="w-20 h-20 bg-emerald-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-emerald-600/40 hover:scale-110 active:scale-90 transition-all">
                <Phone size={36} />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Smile({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function Paperclip({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function MoreVertical({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function CheckCheck({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  );
}

function Square({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
  );
}

function ArrowLeft({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
