"use client";

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <div className="min-h-full flex flex-col items-center p-4 pt-10 md:pt-16 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1600px] px-4 md:px-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
               <Sparkles className="w-5 h-5 text-indigo-400" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight text-white">Overview Dashboard</h1>
               <p className="text-sm text-neutral-400">Monitor your lead generation performance.</p>
             </div>
          </div>
          <Link href="/campaigns/new" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-4 h-4" /> Create Campaign
          </Link>
        </div>

        {/* New Database-Friendly Dashboard */}
        <Dashboard />

      </motion.div>

    </div>
  );
}
