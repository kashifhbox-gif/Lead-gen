"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Megaphone, Target, BadgeCheck, Activity, Loader2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 w-full mt-12">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Campaigns" value={stats.totalCampaigns} icon={<Megaphone className="w-5 h-5" />} color="from-blue-500 to-indigo-600" />
        <KPICard title="Total Leads" value={stats.totalLeads} icon={<Target className="w-5 h-5" />} color="from-indigo-500 to-purple-600" />
        <KPICard title="Qualified Leads" value={stats.qualifiedLeads} icon={<BadgeCheck className="w-5 h-5" />} color="from-emerald-400 to-emerald-600" />
        <KPICard title="Qualification Rate" value={`${stats.qualificationRate}%`} icon={<Activity className="w-5 h-5" />} color="from-purple-500 to-pink-600" />
      </div>

      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0b0f19]/80 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.05)]"
      >
        <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Lead Performance Trends (Last 30 Days)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(11,15,25,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="totalLeads" name="Total Leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              <Area type="monotone" dataKey="qualifiedLeads" name="Qualified Leads" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorQualified)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Campaigns Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0b0f19]/80 border border-indigo-500/20 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.05)]"
      >
        <div className="p-6 border-b border-indigo-500/10">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-400" />
            Recent Lead Campaigns
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-indigo-500/[0.02] border-b border-indigo-500/10">
              <tr>
                <th className="px-6 py-4 font-medium text-neutral-400">Campaign Query</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Status</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Date Created</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Total Leads</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Qualified</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Rate</th>
                <th className="px-6 py-4 font-medium text-neutral-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/5">
              {stats.recentCampaigns.map((job: any) => {
                const total = job.stats?.totalLeads || 0;
                const qualified = job.stats?.qualifiedLeads || 0;
                const rate = total > 0 ? ((qualified / total) * 100).toFixed(1) : 0;
                
                return (
                  <tr key={job._id} className="hover:bg-indigo-500/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white truncate max-w-[200px]" title={job.searchQuery}>"{job.searchQuery}"</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{total}</td>
                    <td className="px-6 py-4 text-emerald-400 font-medium">{qualified}</td>
                    <td className="px-6 py-4">{rate}%</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/campaigns/${job._id}`} className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
                        View <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function KPICard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden bg-[#0b0f19]/80 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-xl group shadow-[0_0_30px_rgba(99,102,241,0.03)]"
    >
      <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${color} opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity duration-500`} />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg shadow-indigo-500/20`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h4>
        <p className="text-sm text-neutral-400 font-medium">{title}</p>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let colorClass = 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
  let label = status;
  let icon = null;

  if (status === 'COMPLETED') {
    colorClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]';
    label = 'Completed';
  } else if (status === 'SCRAPING' || status === 'EVALUATING' || status === 'SCRAPED') {
    colorClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
    label = status;
    icon = <Loader2 className="w-3 h-3 animate-spin mr-1.5 inline-block" />;
  } else if (status === 'FAILED') {
    colorClass = 'bg-red-500/20 text-red-300 border-red-500/30';
    label = 'Failed';
  }

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${colorClass} backdrop-blur-md inline-flex items-center`}>
      {icon}
      {label}
    </span>
  );
}
