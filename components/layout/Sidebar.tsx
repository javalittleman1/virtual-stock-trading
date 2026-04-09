'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Star, ArrowLeftRight, BarChart2, PieChart } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/stocks', label: '行情', icon: TrendingUp },
  { href: '/watchlist', label: '自选', icon: Star },
  { href: '/trade', label: '交易', icon: ArrowLeftRight },
  { href: '/analysis', label: '分析', icon: BarChart2 },
  { href: '/portfolio', label: '资产', icon: PieChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();

  if (!user) return null;

  return (
    <aside
      className="hidden lg:flex flex-col w-[260px] shrink-0"
      style={{
        background: 'var(--guzhang-bg-sidebar)',
        borderRight: '1px solid var(--guzhang-border-light)',
      }}
    >
      {/* Logo 区 */}
      <div className="px-6 pt-7 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>股掌</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--guzhang-text-secondary)' }}>仿真交易 · 智能复盘</p>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-[18px] py-[14px] rounded-2xl text-base font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'hover:opacity-80'
              )}
              style={isActive ? { background: 'var(--guzhang-nav-active-bg)' } : { color: 'var(--guzhang-text-secondary)' }}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 底部 */}
      <div className="px-6 py-5 space-y-3" style={{ borderTop: '1px solid var(--guzhang-border-light)' }}>
        <p className="text-sm" style={{ color: 'var(--guzhang-text-secondary)' }}>
          初始资金 1,000,000
        </p>
        <button
          onClick={signOut}
          className="w-full text-left px-4 py-2 rounded-[30px] text-sm cursor-pointer transition-colors hover:bg-destructive/10 hover:text-destructive"
          style={{ border: '1px solid var(--guzhang-border-light)', color: 'var(--guzhang-text-secondary)' }}
        >
          退出登录
        </button>
      </div>
    </aside>
  );
}
