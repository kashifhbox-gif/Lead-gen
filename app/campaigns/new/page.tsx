"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Sparkles, CheckCircle2, XCircle, ArrowRight, Hash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import KeywordsSidebar from '@/components/KeywordsSidebar';

export default function NewCampaignPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPosts, setMaxPosts] = useState('20');
  const [postedLimit, setPostedLimit] = useState('24h');
  const [postedLimitDate, setPostedLimitDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [profileScraperMode, setProfileScraperMode] = useState('short');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerate = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = overrideQuery || searchQuery;
    if (!queryToUse) return;
    
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchQuery: queryToUse, 
          maxPosts: parseInt(maxPosts) || 20,
          postedLimit: postedLimit || undefined,
          postedLimitDate: postedLimitDate || undefined,
          sortBy: sortBy || undefined,
          profileScraperMode: profileScraperMode || undefined,
        }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Campaign created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setMessage(`Error: ${data.error}`);
        setLoading(false);
      }
    } catch (err) {
      setMessage('An error occurred while connecting to the server.');
      setLoading(false);
    }
  };

  const handleKeywordSelect = (keyword: string) => {
    setSearchQuery(keyword);
  };

  return (
    <div className="min-h-full flex flex-col items-center p-4 pt-6 md:pt-10 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1600px] flex flex-col gap-6"
      >
        <div className="w-full">
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* Left Sidebar for Keywords */}
          <div className="w-full xl:w-80 shrink-0 h-[600px] sticky top-6">
            <KeywordsSidebar onSelectKeyword={handleKeywordSelect} />
          </div>

          {/* Right Main Content */}
          <div className="flex-1 w-full max-w-4xl mx-auto xl:mx-0">
            <div className="text-center md:text-left mb-8 flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/20"
              >
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
                  Create Campaign
                </h1>
                <p className="text-neutral-400 font-light mt-1 text-sm md:text-base">
                  Enter a search keyword and how many posts to analyze. We'll find them and let Gemini qualify the leads.
                </p>
              </div>
            </div>

            <motion.div 
              className="bg-[#0b0f19]/80 border border-indigo-500/20 rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.05)] relative overflow-hidden"
            >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-50" />
          
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
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">Profile Scrape Mode</label>
                  <select 
                    value={profileScraperMode} 
                    onChange={(e) => setProfileScraperMode(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.05] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                  >
                    <option value="short">Short</option>
                    <option value="main">Main (Cost: $0.002 per profile)</option>
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
          </div>
        </div>
      </motion.div>
    </div>
  );
}
