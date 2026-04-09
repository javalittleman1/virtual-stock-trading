'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Star, ArrowLeftRight, BarChart2, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/stocks', label: '行情', icon: TrendingUp },
  { href: '/watchlist', label: '自选', icon: Star },
  { href: '/trade', label: '交易', icon: ArrowLeftRight },
  { href: '/analysis', label: '分析', icon: BarChart2 },
  { href: '/portfolio', label: '资产', icon: PieChart },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        background: 'var(--guzhang-bg-app)',
        borderTop: '1px solid var(--guzhang-border-light)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around pt-2 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 flex-1 transition-colors',
                isActive ? 'text-primary' : ''
              )}
              style={!isActive ? { color: 'var(--guzhang-text-secondary)' } : {}}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
