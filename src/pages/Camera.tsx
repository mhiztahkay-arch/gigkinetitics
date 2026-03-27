import { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, Video, X, Circle, RotateCcw, Download, Play, Pause, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../lib/ThemeContext';

export default function Camera() {
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("No fit access camera, boss. Check permissions.");
      console.error(err);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      setCapturedImage(canvas.toDataURL('image/png'));
    }
  };

  const startRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadVideo = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gigkinetics-video.webm';
    a.click();
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-neutral-900'}`}>
      {/* Top Bar */}
      <div className="p-4 flex justify-between items-center z-10">
        <button onClick={() => window.history.back()} className="p-2 glass rounded-full text-white">
          <X size={24} />
        </button>
        <div className="flex gap-4">
          <button 
            onClick={() => setMode('photo')}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mode === 'photo' ? 'bg-white text-black' : 'text-white/60'}`}
          >
            Photo
          </button>
          <button 
            onClick={() => setMode('video')}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${mode === 'video' ? 'bg-white text-black' : 'text-white/60'}`}
          >
            Video
          </button>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="text-center p-8 space-y-4">
            <p className="text-white font-bold">{error}</p>
            <button onClick={startCamera} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">Retry</button>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} className="w-full h-full object-cover" alt="captured" />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}

        {isRecording && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest">Recording</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 pb-12 flex flex-col items-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-12">
          {capturedImage || recordedChunks.length > 0 ? (
            <button 
              onClick={() => {
                setCapturedImage(null);
                setRecordedChunks([]);
              }}
              className="p-4 glass rounded-full text-white hover:bg-white/20 transition-all"
            >
              <RotateCcw size={28} />
            </button>
          ) : (
            <div className="w-16" />
          )}

          <button 
            onClick={mode === 'photo' ? takePhoto : (isRecording ? stopRecording : startRecording)}
            className="relative group"
          >
            <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1">
              <div className={`w-full h-full rounded-full transition-all ${
                isRecording ? 'bg-red-600 scale-75 rounded-lg' : 'bg-white group-hover:scale-90'
              }`} />
            </div>
          </button>

          {capturedImage ? (
            <a href={capturedImage} download="gigkinetics-photo.png" className="p-4 glass rounded-full text-white hover:bg-white/20 transition-all">
              <Download size={28} />
            </a>
          ) : recordedChunks.length > 0 ? (
            <button onClick={downloadVideo} className="p-4 glass rounded-full text-white hover:bg-white/20 transition-all">
              <Download size={28} />
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>

        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
          {mode === 'photo' ? 'Tap to capture' : (isRecording ? 'Tap to stop' : 'Tap to record')}
        </p>
      </div>
    </div>
  );
}
