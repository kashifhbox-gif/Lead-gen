'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Activity, Settings, Sparkles, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Generate', href: '/', icon: Sparkles },
    { name: 'Campaigns', href: '/campaigns', icon: Activity },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (pathname === '/login') {
    return null;
  }

  return (
    <aside className="w-64 border-r border-white/5 bg-[#050505] shadow-[4px_0_24px_rgba(0,0,0,0.5)] relative z-50 h-screen flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg tracking-tight">
          <Sparkles className="w-5 h-5" />
          <span>LeadGen AI</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4 px-3">
          Overview
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-500/20 text-white shadow-sm' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-white/70'}`} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-white/90 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
