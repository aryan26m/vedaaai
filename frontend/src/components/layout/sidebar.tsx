'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  FileText,
  Bot,
  BookOpen,
  Settings,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'My Groups', href: '/groups', icon: Users },
  { label: 'Assignments', href: '/assignments', icon: FileText, badge: 10 },
  { label: 'AI Teacher\'s Toolkit', href: '/toolkit', icon: Bot },
  { label: 'My Library', href: '/library', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900">
          <span className="text-lg font-bold text-white">V</span>
        </div>
        <span className="text-xl font-bold tracking-tight">VedaAI</span>
      </div>

      {/* Create Button */}
      <div className="px-4 pb-2">
        <Link href="/assignments/create">
          <Button className="w-full gap-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 shadow-md">
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                )}
              >
                <item.icon
                  className={cn(
                    'h-[18px] w-[18px] transition-colors',
                    isActive ? 'text-neutral-900' : 'text-neutral-400 group-hover:text-neutral-600'
                  )}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t px-3 py-2">
        <Link href="/settings">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700">
            <Settings className="h-[18px] w-[18px] text-neutral-400" />
            <span>Settings</span>
          </div>
        </Link>
      </div>

      {/* School Info */}
      <div className="border-t px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <span className="text-sm font-semibold text-amber-700">DP</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">
              Delhi Public School
            </p>
            <p className="truncate text-xs text-neutral-500">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
