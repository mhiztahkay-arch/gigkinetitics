import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, MessageSquare, ArrowRight, CreditCard, Send, User, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  escrow_funded: boolean;
  client_id: string;
  provider_id: string;
}

export default function JobDetails({ user }: { user: any }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [receptionMethod, setReceptionMethod] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [showApply, setShowApply] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    const [jobsRes, settingsRes, proposalsRes] = await Promise.all([
      fetch('/api/jobs'),
      fetch('/api/settings/commission'),
      fetch(`/api/proposals/${jobId}`)
    ]);
    
    const jobsData = await jobsRes.json();
    const settingsData = await settingsRes.json();
    const proposalsData = await proposalsRes.json();

    const found = jobsData.find((j: any) => j.id === jobId);
    setJob(found);
    setReceptionMethod(settingsData);
    setProposals(proposalsData);
    if (found) setBidAmount(found.budget.toString());
    setLoading(false);
  };

  const handleApply = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          provider_id: user.id,
          bid_amount: parseInt(bidAmount),
          cover_letter: coverLetter
        })
      });
      if (res.ok) {
        setShowApply(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to apply', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptProposal = async (proposal: any) => {
    if (!confirm(`Accept ${proposal.provider_name}'s proposal for ₦${proposal.bid_amount.toLocaleString()}?`)) return;
    
    const res = await fetch('/api/proposals/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposalId: proposal.id,
        jobId: jobId,
        providerId: proposal.provider_id
      })
    });
    
    if (res.ok) {
      fetchData();
    }
  };

  const handleFundEscrow = async () => {
    const res = await fetch('/api/escrow/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, amount: job?.budget })
    });
    if (res.ok) {
      setJob(prev => prev ? { ...prev, escrow_funded: true, status: 'in_progress' } : null);
    }
  };

  const handleReleaseEscrow = async () => {
    const res = await fetch('/api/escrow/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId })
    });
    if (res.ok) {
      const data = await res.json();
      const receptionText = receptionMethod?.type === 'opay' 
        ? `OPay ${receptionMethod.account_number}` 
        : `${receptionMethod?.type} (${receptionMethod?.account_number || receptionMethod?.email})`;
      
      alert(`Escrow released! ₦${data.released} sent to provider. 10% fee (₦${data.fee}) deducted to ${receptionText}.`);
      setJob(prev => prev ? { ...prev, status: 'completed' } : null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading gig details...</div>;
  if (!job) return <div className="p-8 text-center text-red-500">Gig not found.</div>;

  const isClient = user.id === job.client_id;
  const isProvider = user.id === job.provider_id || !job.provider_id;

  const receptionText = receptionMethod?.type === 'opay' 
    ? `OPay ${receptionMethod.account_number}` 
    : `${receptionMethod?.type} (${receptionMethod?.account_number || receptionMethod?.email})`;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <section className="space-y-2">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-white">{job.title}</h2>
          <span className="bg-emerald-900/50 text-emerald-400 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20">
            {job.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-neutral-400 text-sm leading-relaxed">{job.description}</p>
      </section>

      {/* Budget Card */}
      <div className="glass p-5 rounded-2xl flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total Budget</p>
          <p className="text-3xl font-bold text-white">₦{job.budget.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Platform Fee (10%)</p>
          <p className="text-sm font-bold text-red-400">-₦{(job.budget * 0.1).toLocaleString()}</p>
        </div>
      </div>

      {/* Escrow Status */}
      <section className={`p-4 rounded-2xl border backdrop-blur-sm ${
        job.escrow_funded 
          ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-100' 
          : 'bg-amber-950/30 border-amber-500/20 text-amber-100'
      }`}>
        <div className="flex gap-3 items-start">
          {job.escrow_funded ? <Shield className="text-emerald-500" /> : <AlertCircle className="text-amber-500" />}
          <div>
            <h3 className="font-bold text-sm">Escrow Payment System</h3>
            <p className="text-xs mt-1 opacity-80">
              {job.escrow_funded 
                ? "Money dey safe for escrow. Provider fit start work now." 
                : "Money never enter escrow yet. No start work until client fund am."}
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="space-y-3">
        {job.status === 'open' && !isClient && (
          <button 
            onClick={() => setShowApply(!showApply)}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
          >
            <Send size={20} />
            {showApply ? 'Cancel Application' : 'Apply for this Gig'}
          </button>
        )}

        <AnimatePresence>
          {showApply && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass p-5 rounded-2xl space-y-4 overflow-hidden"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Your Bid (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₦</span>
                  <input 
                    type="number" 
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Cover Letter</label>
                <textarea 
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell the client why you are the best for this job..."
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <button 
                onClick={handleApply}
                disabled={submitting || !coverLetter}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Link 
          to={`/chat/${job.id}`}
          className="w-full glass text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
        >
          <MessageSquare size={20} />
          Chat with {isClient ? 'Provider' : 'Client'}
        </Link>

        {isClient && !job.escrow_funded && job.status === 'in_progress' && (
          <button 
            onClick={handleFundEscrow}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
          >
            <CreditCard size={20} />
            Fund Escrow (₦{job.budget.toLocaleString()})
          </button>
        )}

        {isClient && job.escrow_funded && job.status === 'in_progress' && (
          <button 
            onClick={handleReleaseEscrow}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle size={20} />
            Release Payment (Job Done)
          </button>
        )}

        {!isClient && job.status === 'in_progress' && !job.escrow_funded && (
          <div className="p-4 glass rounded-2xl text-center text-sm text-neutral-500 italic">
            Waiting for client to fund escrow...
          </div>
        )}
      </div>

      {/* Proposals Section (for Client) */}
      {isClient && job.status === 'open' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Proposals ({proposals.length})</h3>
          </div>
          <div className="space-y-3">
            {proposals.length === 0 ? (
              <div className="text-center py-8 glass rounded-2xl border-dashed border-white/10">
                <p className="text-xs text-neutral-500 italic">No proposals yet. Wait small.</p>
              </div>
            ) : (
              proposals.map((p) => (
                <div key={p.id} className="glass p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <img 
                        src={p.provider_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.provider_name}`} 
                        className="w-10 h-10 rounded-full border border-white/10"
                        alt="avatar"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{p.provider_name}</h4>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">{p.provider_skills}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-500">₦{p.bid_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{p.cover_letter}</p>
                  <button 
                    onClick={() => handleAcceptProposal(p)}
                    className="w-full bg-white/5 border border-white/10 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:border-emerald-600 transition-all"
                  >
                    Accept Proposal
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="pt-4 border-t border-white/10">
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">How it works</h4>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/10">1</div>
            <p className="text-xs text-neutral-400">Client funds escrow. Gigflow holds the money safe.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/10">2</div>
            <p className="text-xs text-neutral-400">Provider completes the job and submits for review.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/10">3</div>
            <p className="text-xs text-neutral-400">Client releases payment. 10% fee goes to Gigflow ({receptionText}).</p>
          </div>
        </div>
      </section>
    </div>
  );
}
