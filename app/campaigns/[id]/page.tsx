'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, ExternalLink, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft, ThumbsUp, MessageSquare, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

import ConfirmModal from '@/components/ConfirmModal';

interface Lead {
  _id: string;
  postContent: string;
  postUrl?: string;
  profileUrl?: string;
  engagementStats?: {
    likes?: number;
    comments?: number;
  };
  score?: number;
  aiReasoning?: string;
  isQualified?: boolean;
}

interface Job {
  _id: string;
  searchQuery?: string;
  profileUrl?: string;
  status: string;
  createdAt: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, QUALIFIED, REJECTED, PENDING
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteCampaignModalOpen, setDeleteCampaignModalOpen] = useState(false);
  const [deleteLeadModalOpen, setDeleteLeadModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter]);

  const fetchJobDetails = async () => {
    try {
      const res = await fetch(`/api/campaigns/${jobId}?page=${currentPage}&limit=20&filter=${filter}&searchQuery=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Job not found');
      const data = await res.json();
      setJob(data.job);
      setLeads(data.leads);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
    const interval = setInterval(fetchJobDetails, 5000);
    return () => clearInterval(interval);
  }, [jobId, currentPage, filter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FAILED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'EVALUATING': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'SCRAPING': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <h2 className="text-xl font-semibold text-white">Campaign not found</h2>
        <button onClick={() => router.push('/campaigns')} className="mt-4 text-indigo-400 hover:text-indigo-300">
          Return to Campaigns
        </button>
      </div>
    );
  }

  const evaluatedCount = leads.filter(l => l.isQualified !== undefined).length;
  const totalCount = leads.length;

  // Server-side pagination already applied
  const filteredLeads = leads;
  const ITEMS_PER_PAGE = 20;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/campaigns" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Campaigns</span>
        </Link>
        <button 
          onClick={() => {
            setDeleteCampaignModalOpen(true);
          }}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
        >
          Delete Campaign
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-xl mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              {job.searchQuery ? `Search: "${job.searchQuery}"` : 'Profile Scraping'}
            </h1>
            <p className="text-sm text-neutral-400">
              ID: {job._id} • Started {new Date(job.createdAt).toLocaleString()}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl border font-medium flex items-center gap-2 ${getStatusColor(job.status)}`}>
            {job.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
            {job.status}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 flex gap-8">
          <div>
            <p className="text-sm text-neutral-400 mb-1">Leads Scraped</p>
            <p className="text-2xl font-semibold text-white">{totalCount}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-400 mb-1">AI Evaluated</p>
            <p className="text-2xl font-semibold text-indigo-400">
              {evaluatedCount} <span className="text-sm font-normal text-neutral-500">/ {totalCount}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold text-white">Scraped Leads ({filteredLeads.length})</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64 transition-colors"
          />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="ALL">All Leads</option>
            <option value="QUALIFIED">Qualified Only</option>
            <option value="REJECTED">Rejected Only</option>
            <option value="PENDING">Pending Evaluation</option>
          </select>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
          <p className="text-neutral-400">No leads found matching your criteria.</p>
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
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead._id} 
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer" 
                    onClick={() => router.push(`/leads/${lead._id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
                        <a 
                          href={lead.profileUrl || '#'} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-medium text-white hover:text-indigo-400 transition-colors truncate max-w-[120px] sm:max-w-[150px] inline-block"
                          title={lead.profileUrl}
                        >
                          {lead.profileUrl?.split('linkedin.com/in/')[1]?.split('/')[0] || 'Unknown'}
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
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-neutral-500" /> {lead.engagementStats?.likes || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-neutral-500" /> {lead.engagementStats?.comments || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-indigo-400" />
                          <span className="font-semibold text-white">{lead.score}/10</span>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.isQualified === true && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Qualified</span>}
                      {lead.isQualified === false && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>}
                      {lead.isQualified === undefined && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">Evaluating</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadToDelete(lead._id);
                            setDeleteLeadModalOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                        <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/20">
              <div className="text-xs text-neutral-500">
                Page {currentPage} of {totalPages}
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

      <ConfirmModal
        isOpen={deleteCampaignModalOpen}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign and all its leads? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (job) {
            try {
              await fetch(`/api/campaigns/${job._id}`, { method: 'DELETE' });
              router.push('/campaigns');
            } catch (err) {
              console.error(err);
            }
          }
        }}
        onCancel={() => setDeleteCampaignModalOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteLeadModalOpen}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (leadToDelete) {
            try {
              await fetch(`/api/leads/${leadToDelete}`, { method: 'DELETE' });
              fetchJobDetails();
            } catch (err) {
              console.error(err);
            }
          }
        }}
        onCancel={() => {
          setDeleteLeadModalOpen(false);
          setLeadToDelete(null);
        }}
      />
    </div>
  );
}
