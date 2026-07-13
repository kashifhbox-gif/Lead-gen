'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ExternalLink, MessageSquare, Heart, Share2, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

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

  const totalPages = Math.ceil(leads.length / ITEMS_PER_PAGE);
  const paginatedLeads = leads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Qualified Leads</h1>
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
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-neutral-400">
              <thead className="text-xs text-neutral-500 uppercase bg-black/40 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Profile</th>
                  <th className="px-6 py-4 font-medium w-2/5">Post Preview</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Engagement</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">AI Score</th>
                  <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedLeads.map((lead) => (
                  <tr 
                    key={lead._id} 
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer" 
                    onClick={() => router.push(`/leads/${lead._id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Users className="w-4 h-4 text-purple-400 shrink-0" />
                        <a 
                          href={lead.profileUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-medium text-white hover:text-purple-400 transition-colors truncate max-w-[120px] sm:max-w-[150px] inline-block"
                          title={lead.profileUrl}
                        >
                          {lead.profileUrl.split('linkedin.com/in/')[1]?.split('/')[0] || 'Unknown'}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 text-neutral-300 min-w-[200px]" title={lead.postContent}>
                        {lead.postContent}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-neutral-500" /> {lead.engagementStats?.likes || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-neutral-500" /> {lead.engagementStats?.comments || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-white">{lead.score}/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/20">
              <div className="text-xs text-neutral-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, leads.length)} of {leads.length} leads
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  Previous
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
