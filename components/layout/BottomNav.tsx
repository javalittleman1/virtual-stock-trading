'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  TrendingUp, 
  Wallet, 
  PieChart, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/stocks', label: '行情', icon: TrendingUp },
  { href: '/trade', label: '交易', icon: Wallet },
  { href: '/portfolio', label: '持仓', icon: PieChart },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1",
                "transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5",
                isActive && "fill-current"
              )} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
