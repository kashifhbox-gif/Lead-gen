'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Activity, Settings, Sparkles } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Generate', href: '/', icon: Sparkles },
    { name: 'Jobs', href: '/jobs', icon: Activity },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-white/10 bg-black/50 backdrop-blur-xl h-screen flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg tracking-tight">
          <Sparkles className="w-5 h-5" />
          <span>LeadGen AI</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 px-3">
          Overview
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 \${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-400' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 \${isActive ? 'text-indigo-400' : 'text-neutral-500'}`} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-indigo-500/20">
          <p className="text-xs text-indigo-300 font-medium mb-1">Free Tier Active</p>
          <div className="w-full bg-black/40 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <p className="text-[10px] text-neutral-400">45/100 Jobs this month</p>
        </div>
      </div>
    </aside>
  );
}
