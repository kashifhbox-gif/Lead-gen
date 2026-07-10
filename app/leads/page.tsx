'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ExternalLink, MessageSquare, Heart, Share2, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Lead {
  _id: string;
  profileUrl: string;
  postContent: string;
  postUrl?: string;
  engagementStats: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  score: number;
  aiReasoning: string;
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Qualified Leads</h1>
            <p className="text-sm text-neutral-400">Profiles flagged by AI based on buying signals.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
          <Users className="w-8 h-8 text-neutral-600 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No Leads Yet</h3>
          <p className="text-sm text-neutral-400 max-w-md mb-4">Submit some LinkedIn profiles and wait for the AI to find high-quality leads.</p>
          <Link href="/" className="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            Generate Leads <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {leads.map((lead, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={lead._id}
              className="bg-white/[0.02] border border-white/5 hover:border-purple-500/30 rounded-2xl p-6 flex flex-col transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-24 h-24 text-purple-500 -mr-6 -mt-6" />
              </div>
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <a 
                  href={lead.profileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-medium text-white hover:text-purple-400 transition-colors flex items-center gap-1.5"
                >
                  {lead.profileUrl.split('linkedin.com/in/')[1]?.split('/')[0] || 'View Profile'}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <Sparkles className="w-3 h-3" />
                  Score: {lead.score}/10
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-4 mb-4 flex-1 relative z-10 border border-white/[0.02]">
                <p className="text-sm text-neutral-300 line-clamp-4 leading-relaxed mb-3">
                  "{lead.postContent}"
                </p>
                {lead.postUrl && (
                  <a href={lead.postUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 w-fit">
                    View original post <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="space-y-4 relative z-10">
                <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3">
                  <p className="text-xs text-purple-200/70 mb-1 font-medium uppercase tracking-wider">AI Reasoning</p>
                  <p className="text-sm text-purple-100/90 leading-snug">{lead.aiReasoning}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    {lead.engagementStats.likes || 0}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {lead.engagementStats.comments || 0}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    {lead.engagementStats.shares || 0}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
