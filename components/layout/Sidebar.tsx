'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  TrendingUp, 
  Wallet, 
  PieChart, 
  Star,
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/stocks', label: '行情中心', icon: TrendingUp },
  { href: '/watchlist', label: '自选股', icon: Star },
  { href: '/trade', label: '交易下单', icon: Wallet },
  { href: '/portfolio', label: '持仓资产', icon: PieChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300 hidden lg:block",
          sidebarCollapsed ? "w-16" : "w-56"
        )}
      >
        <div className="flex h-full flex-col">
          {/* 折叠按钮 */}
          <div className="flex justify-end p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
            >
              <X className={cn(
                "h-4 w-4 transition-transform",
                sidebarCollapsed && "rotate-180"
              )} />
              <span className="sr-only">
                {sidebarCollapsed ? '展开' : '收起'}
              </span>
            </Button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 space-y-1 p-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 底部设置 */}
          <div className="border-t p-2">
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? '设置' : undefined}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">设置</span>
              )}
            </Link>
          </div>
        </div>
      </aside>

      {/* 移动端侧边栏遮罩 */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
