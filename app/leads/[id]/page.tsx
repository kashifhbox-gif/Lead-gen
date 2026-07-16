'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, ExternalLink, ArrowLeft, ThumbsUp, MessageSquare, BrainCircuit, CheckCircle2, XCircle, Loader2, Calendar, Mail, Edit2, Save, X } from 'lucide-react';
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
  outreachHook?: string;
  isQualified?: boolean;
  firstName?: string;
  lastName?: string;
  firstPersonalEmail?: string;
  personalEmails?: string[];
  phones?: string[];
  apolloEnrichmentAttempted?: boolean;
  apolloEmailEnrichmentRequested?: boolean;
  apolloPhoneEnrichmentRequested?: boolean;
  postedAt?: string;
  jobId?: {
    _id: string;
    searchQuery?: string;
    status: string;
  };
}

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichMessage, setEnrichMessage] = useState('');
  
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleEditClick = () => {
    if (!lead) return;
    setEditForm({
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.firstPersonalEmail || '',
      phone: lead.phones && lead.phones.length > 0 ? lead.phones[0] : ''
    });
    setIsEditingContact(true);
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          firstPersonalEmail: editForm.email,
          phone: editForm.phone
        })
      });
      const data = await res.json();
      if (res.ok && data.lead) {
        setLead(data.lead);
        setIsEditingContact(false);
      } else {
        alert(data.error || 'Failed to save contact info');
      }
    } catch (e) {
      alert('Error saving contact info');
    } finally {
      setSavingContact(false);
    }
  };

  const handleEnrichLead = async () => {
    setEnriching(true);
    setEnrichMessage('');
    try {
      const res = await fetch(`/api/leads/${leadId}/enrich`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setEnrichMessage(data.message || 'Contact info fetched successfully!');
        if (data.lead) {
          setLead(data.lead);
        }
      } else {
        setEnrichMessage(data.error || data.message || 'Failed to fetch contact info');
      }
    } catch (err) {
      setEnrichMessage('An error occurred while fetching contact info.');
    } finally {
      setEnriching(false);
      setTimeout(() => setEnrichMessage(''), 5000);
    }
  };

  useEffect(() => {
    const fetchLeadDetails = async () => {
      try {
        const res = await fetch(`/api/leads/${leadId}`);
        if (!res.ok) throw new Error('Lead not found');
        const data = await res.json();
        setLead(data.lead);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeadDetails();
  }, [leadId]);

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h2 className="text-xl font-semibold text-white">Lead not found</h2>
        <button onClick={() => router.back()} className="mt-4 text-indigo-400 hover:text-indigo-300">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex gap-3">
          {lead?.profileUrl && (
            <>
              {(!lead.firstPersonalEmail || !(lead.phones && lead.phones.length > 0)) && (
                <button 
                  onClick={handleEnrichLead}
                  disabled={enriching || lead.apolloEmailEnrichmentRequested || lead.apolloEnrichmentAttempted}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {enriching ? 'Processing...' : (lead.apolloEmailEnrichmentRequested || lead.apolloEnrichmentAttempted) ? 'Searched' : 'Find Contact Info'}
                </button>
              )}
            </>
          )}
          <button 
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Delete Lead
          </button>
        </div>
      </div>
      
      {enrichMessage && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${enrichMessage.includes('error') || enrichMessage.includes('Failed') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
          <Mail className="w-4 h-4" />
          {enrichMessage}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          try {
            await fetch(`/api/leads/${lead._id}`, { method: 'DELETE' });
            router.back();
          } catch (err) {
            console.error(err);
          }
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden"
      >
        {/* Status Ribbon */}
        {lead.isQualified !== undefined && (
          <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-sm font-semibold flex items-center gap-2 ${lead.isQualified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {lead.isQualified ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {lead.isQualified ? 'Qualified Lead' : 'Not Qualified'}
          </div>
        )}

        <div className="flex items-center gap-3 mb-6 pr-32">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              LinkedIn Post
              <a href={lead.postUrl || lead.profileUrl || '#'} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                <ExternalLink className="w-4 h-4" />
              </a>
            </h1>
            {lead.postedAt && (
              <p className="text-sm text-neutral-400 flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(lead.postedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-2xl p-6 mb-8">
          <p className="text-base text-neutral-200 leading-relaxed whitespace-pre-wrap">
            {lead.postContent}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Engagement */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Engagement</h3>
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                  <ThumbsUp className="w-6 h-6 text-indigo-400" />
                  {lead.engagementStats?.likes || 0}
                </span>
                <span className="text-xs text-neutral-500 uppercase font-medium tracking-wider">Likes</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-indigo-400" />
                  {lead.engagementStats?.comments || 0}
                </span>
                <span className="text-xs text-neutral-500 uppercase font-medium tracking-wider">Comments</span>
              </div>
            </div>
          </div>

          {/* AI Score */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <BrainCircuit className="w-40 h-40" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider flex items-center gap-2 relative z-10">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              AI Score
            </h3>
            <div className="relative z-10">
              {lead.score !== undefined ? (
                <div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">{lead.score}</span>
                    <span className="text-lg text-neutral-500 font-medium mb-1">/ 10</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2 mb-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${lead.score >= 7 ? 'bg-emerald-500' : lead.score >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${(lead.score / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  Pending evaluation...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        {(lead.firstPersonalEmail || lead.firstName || lead.lastName || (lead.phones && lead.phones.length > 0) || isEditingContact) && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Information
              </h3>
              {!isEditingContact && (
                <button 
                  onClick={handleEditClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Details
                </button>
              )}
            </div>
            
            {isEditingContact ? (
              // ... keeping edit form same ...
              <div className="flex flex-col gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button 
                    onClick={() => setIsEditingContact(false)}
                    className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveContact}
                    disabled={savingContact}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {savingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
              {(lead.firstName || lead.lastName) && (
                <div className="text-white font-medium text-lg">
                  {lead.firstName} {lead.lastName}
                </div>
              )}
              {lead.firstPersonalEmail ? (
                <div className="text-emerald-300 font-medium text-lg flex items-center gap-2">
                  {lead.firstPersonalEmail}
                </div>
              ) : lead.apolloEmailEnrichmentRequested ? (
                <div className="mt-2 text-sm text-emerald-400/80 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching Apollo for email...
                </div>
              ) : lead.apolloEnrichmentAttempted ? (
                <div className="text-red-400/80 font-medium text-sm mt-1">
                  Email Not Found
                </div>
              ) : (
                <div className="text-neutral-500 italic text-sm mt-1">
                  No email address available.
                </div>
              )}
              {lead.personalEmails && lead.personalEmails.length > 1 && (
                <div className="mt-2 text-sm text-neutral-400">
                  <p className="mb-1 font-medium text-neutral-500 uppercase tracking-wider text-xs">Other Known Emails:</p>
                  <ul className="list-disc list-inside">
                    {lead.personalEmails.filter(e => e !== lead.firstPersonalEmail).map(e => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {lead.phones && lead.phones.length > 0 ? (
                <div className="mt-2 text-sm text-neutral-400">
                  <p className="mb-1 font-medium text-neutral-500 uppercase tracking-wider text-xs">Phone Numbers:</p>
                  <ul className="list-disc list-inside">
                    {lead.phones.map(p => (
                      <li key={p} className="text-emerald-300">{p}</li>
                    ))}
                  </ul>
                </div>
              ) : lead.apolloPhoneEnrichmentRequested ? (
                <div className="mt-2 text-sm text-emerald-400/80 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching Apollo for phone...
                </div>
              ) : lead.apolloEnrichmentAttempted ? (
                <div className="mt-2 text-sm text-red-400/80 font-medium">
                  Phone Not Found
                </div>
              ) : null}
            </div>
            )}
          </div>
        )}

        {/* AI Reasoning */}
        {lead.aiReasoning && (
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-indigo-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              AI Reasoning
            </h3>
            <p className="text-neutral-300 leading-relaxed text-sm">
              {lead.aiReasoning}
            </p>
          </div>
        )}

        {/* Outreach Hook */}
        {lead.outreachHook && (
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-6 mt-6">
            <h3 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Suggested Outreach Hook
            </h3>
            <p className="text-neutral-300 leading-relaxed text-sm italic">
              "{lead.outreachHook}"
            </p>
          </div>
        )}
        
        {/* Origin Campaign */}
        {lead.jobId && (
          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-1">Origin Campaign</p>
              <p className="text-sm text-white font-medium">
                {lead.jobId.searchQuery ? `Search: "${lead.jobId.searchQuery}"` : 'Profile Scraping'}
              </p>
            </div>
            <Link 
              href={`/campaigns/${lead.jobId._id}`}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
            >
              View Campaign
            </Link>
          </div>
        )}

      </motion.div>
    </div>
  );
}
