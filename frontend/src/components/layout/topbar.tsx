'use client';

import { usePathname } from 'next/navigation';
import { ArrowLeft, Bell, Grid3X3 } from 'lucide-react';
import Link from 'next/link';

function getBreadcrumb(pathname: string): string {
  if (pathname.startsWith('/assignments/create')) return 'Create Assignment';
  if (pathname.startsWith('/assignments/')) return 'Assignment';
  if (pathname.startsWith('/assignments')) return 'Assignment';
  return 'Home';
}

export function TopBar() {
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);
  const showBack = pathname !== '/' && pathname !== '/assignments';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-6">
      <div className="flex items-center gap-3">
        {showBack && (
          <Link
            href="/assignments"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <Grid3X3 className="h-4 w-4 text-neutral-400" />
        <span className="text-sm font-medium text-neutral-600">{breadcrumb}</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <span className="text-xs font-semibold text-amber-700">JD</span>
          </div>
          <span className="text-sm font-medium text-neutral-700">John Doe</span>
          <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </header>
  );
}
