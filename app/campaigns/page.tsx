'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ExternalLink, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';

interface Job {
  _id: string;
  profileUrl?: string;
  searchQuery?: string;
  status: string;
  createdAt: string;
  stats?: {
    totalLeads: number;
    qualifiedLeads: number;
    evaluatedLeads: number;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-neutral-400" />;
      default: return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FAILED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'PENDING': return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <Activity className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Active Campaigns</h1>
          <p className="text-sm text-neutral-400">Monitor your scraping and AI evaluation queues.</p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Activity className="w-8 h-8 text-neutral-600 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No Campaigns Found</h3>
            <p className="text-sm text-neutral-400 mb-4">You haven't submitted any LinkedIn profiles yet.</p>
            <Link href="/" className="text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
              Generate Leads
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {jobs.map((job) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={job._id} 
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`mt-1 px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-2 w-fit ${getStatusColor(job.status)}`}>
                    {getStatusIcon(job.status)}
                    {job.status}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white flex items-center gap-1.5 mb-1">
                      {job.searchQuery ? (
                        <span>Search: "{job.searchQuery}"</span>
                      ) : (
                        <a href={job.profileUrl || '#'} target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                          {job.profileUrl?.split('linkedin.com/in/')[1]?.split('/')[0] || job.profileUrl || 'Unknown Profile'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-neutral-500 mt-1">
                      <span>ID: {job._id}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Started {new Date(job.createdAt).toLocaleDateString()}</span>
                      
                      {job.stats && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <span className="text-neutral-400">Scraped:</span> 
                              <strong className="text-white">{job.stats.totalLeads}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-indigo-400/80">Qualified:</span> 
                              <strong className="text-indigo-400">{job.stats.qualifiedLeads}</strong>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setJobToDelete(job._id);
                      setDeleteModalOpen(true);
                    }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                  <Link 
                    href={`/campaigns/${job._id}`}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign and all its leads? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (jobToDelete) {
            try {
              await fetch(`/api/campaigns/${jobToDelete}`, { method: 'DELETE' });
              fetchJobs();
            } catch (err) {
              console.error(err);
            }
          }
        }}
        onCancel={() => {
          setDeleteModalOpen(false);
          setJobToDelete(null);
        }}
      />
    </div>
  );
}
