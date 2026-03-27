import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Clock, Plus } from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => setJobs(data));
  }, []);

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Browse Gigs</h2>
        <Link 
          to="/post-job" 
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
        >
          <Plus size={18} />
          Post Gig
        </Link>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
        <input 
          type="text" 
          placeholder="Search for jobs (e.g. Graphic Design)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <Link 
            key={job.id} 
            to={`/job/${job.id}`}
            className="block glass p-4 rounded-2xl hover:border-emerald-500 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-white">{job.title}</h4>
              <span className="text-emerald-500 font-bold">₦{job.budget.toLocaleString()}</span>
            </div>
            <p className="text-sm text-neutral-400 line-clamp-2 mb-3">{job.description}</p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>Remote / Lagos</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>2 days ago</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
