import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, AlignLeft, Send, ArrowLeft } from 'lucide-react';

export default function PostJob({ user }: { user: any }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: parseInt(formData.budget),
          client_id: user.id
        })
      });
      if (res.ok) {
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Failed to post job', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-full text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Post a Gig</h2>
          <p className="text-sm text-neutral-400">Find the best talent in Nigeria</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass p-6 rounded-3xl space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Gig Title</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Need a React Developer for Fintech App"
                className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Budget (₦)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₦</span>
              <input
                type="number"
                required
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="50000"
                className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-neutral-500" size={18} />
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you need done..."
                className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={20} />
              Post Gig Now
            </>
          )}
        </button>
      </form>
    </div>
  );
}
