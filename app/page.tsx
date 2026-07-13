"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Sparkles, CheckCircle2, XCircle, ArrowRight, Hash, Database, RefreshCw, Bot } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPosts, setMaxPosts] = useState('20');
  const [postedLimit, setPostedLimit] = useState('24h');
  const [postedLimitDate, setPostedLimitDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [polling, setPolling] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
        
        // Check if any job is still processing
        const isProcessing = data.jobs.some((job: any) => job.status === 'SCRAPING' || job.status === 'EVALUATING' || job.status === 'SCRAPED');
        setPolling(isProcessing);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling) {
      interval = setInterval(fetchJobs, 5000);
    }
    return () => clearInterval(interval);
  }, [polling]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchQuery, 
          maxPosts: parseInt(maxPosts) || 20,
          postedLimit: postedLimit || undefined,
          postedLimitDate: postedLimitDate || undefined,
          sortBy: sortBy || undefined,
        }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Job started successfully! The AI is searching and analyzing the posts in the background.');
        setSearchQuery('');
        fetchJobs(); // trigger immediate refresh
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center p-4 pt-10 md:pt-20 pb-20">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20"
          >
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
            AI Lead Generator
          </h1>
          <p className="text-lg text-neutral-400 font-light">
            Enter a search keyword and how many posts to analyze. We'll find them and let Gemini qualify the leads.
          </p>
        </div>

        <motion.div 
          className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden mb-12"
          whileHover={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          
          <form onSubmit={handleGenerate} className="relative flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search keyword (e.g., 'hiring software engineers')"
                  className="w-full bg-black/20 border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  required
                />
              </div>
              <div className="relative w-full md:w-48">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxPosts}
                  onChange={(e) => setMaxPosts(e.target.value)}
                  placeholder="Max Posts"
                  className="w-full bg-black/20 border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  required
                />
              </div>
            </div>
            
            {/* Advanced Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-neutral-400 hover:text-white flex items-center gap-2 w-fit transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            </button>

            {/* Advanced Filters */}
            {showAdvanced && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col md:flex-row gap-4 p-4 bg-black/20 rounded-2xl border border-white/[0.05]"
              >
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">Posted Limit</label>
                  <select 
                    value={postedLimit} 
                    onChange={(e) => setPostedLimit(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.05] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                  >
                    <option value="any">Any Time (any)</option>
                    <option value="1h">Past hour (1h)</option>
                    <option value="24h">Past 24 hours (24h)</option>
                    <option value="week">Past week (week)</option>
                    <option value="month">Past month (month)</option>
                    <option value="3months">Past 3 months (3months)</option>
                    <option value="6months">Past 6 months (6months)</option>
                    <option value="year">Past year (year)</option>
                  </select>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">Limit Date</label>
                  <input 
                    type="date"
                    value={postedLimitDate}
                    onChange={(e) => setPostedLimitDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.05] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">Sort By</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.05] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                  >
                    <option value="date">Latest (Date)</option>
                    <option value="relevance">Top (Relevance)</option>
                  </select>
                </div>
              </motion.div>
            )}
            
            <button
              type="submit"
              disabled={loading || !searchQuery}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium py-4 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Generate Leads <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
                message.includes('Error') 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              {message.includes('Error') ? (
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm leading-relaxed">{message}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Dashboard Section */}
        {jobs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white/90 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Recent Campaigns
            </h2>

            <div className="grid gap-4">
              {jobs.map((job) => (
                <Link key={job._id} href={`/campaigns/${job._id}`}>
                  <div className="bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all rounded-2xl p-5 cursor-pointer">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">
                          "{job.searchQuery}"
                        </h3>
                        <p className="text-sm text-neutral-500">
                          Started {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border ${
                          job.status === 'SCRAPING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          job.status === 'EVALUATING' || job.status === 'SCRAPED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {(job.status === 'SCRAPING' || job.status === 'EVALUATING' || job.status === 'SCRAPED') && (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          )}
                          {job.status === 'SCRAPING' ? 'Waiting for Apify...' :
                           job.status === 'SCRAPED' ? 'Scrape Done, Preparing...' :
                           job.status === 'EVALUATING' ? 'AI Evaluation in progress...' :
                           job.status}
                        </div>

                        {/* Stats Badges */}
                        <div className="flex gap-2">
                          <div className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/[0.05] text-xs text-neutral-300 flex items-center gap-1.5" title="Total Scraped Leads">
                            <Database className="w-3.5 h-3.5 text-neutral-400" />
                            {job.stats?.totalLeads || 0}
                          </div>
                          
                          {(job.status === 'EVALUATING' || job.status === 'COMPLETED') && (
                            <div className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/[0.05] text-xs text-neutral-300 flex items-center gap-1.5" title="AI Evaluated Leads">
                              <Bot className="w-3.5 h-3.5 text-indigo-400" />
                              {job.stats?.evaluatedLeads || 0}/{job.stats?.totalLeads || 0}
                            </div>
                          )}

                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 flex items-center gap-1.5" title="Qualified Leads">
                            <Sparkles className="w-3.5 h-3.5" />
                            {job.stats?.qualifiedLeads || 0} Qualified
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
