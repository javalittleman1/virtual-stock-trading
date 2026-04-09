'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  TrendingUp, 
  User, 
  LogOut,
  Sun,
  Moon,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserStore } from '@/stores/useUserStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn, formatCurrency } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const { assetOverview } = useUserStore();
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 切换主题
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // 导航链接
  const navLinks = [
    { href: '/', label: '首页', icon: TrendingUp },
    { href: '/stocks', label: '行情', icon: TrendingUp },
    { href: '/trade', label: '交易', icon: Wallet },
    { href: '/portfolio', label: '持仓', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* 左侧：Logo 和菜单按钮 */}
        <div className="flex items-center gap-2">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">打开菜单</span>
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline">模拟炒股</span>
          </Link>
        </div>

        {/* 中间：桌面端导航 */}
        {user && (
          <nav className="hidden lg:flex items-center gap-6 mx-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* 右侧：用户信息、主题切换、退出 */}
        <div className="flex items-center gap-2 ml-auto">
          {/* 主题切换 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">切换主题</span>
          </Button>

          {user ? (
            <>
              {/* 资产概览（桌面端） */}
              {assetOverview && (
                <div className="hidden md:flex items-center gap-4 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">总资产</span>
                    <span className="font-medium">
                      {formatCurrency(assetOverview.total_assets)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">可用</span>
                    <span className="font-medium">
                      {formatCurrency(assetOverview.available_balance)}
                    </span>
                  </div>
                </div>
              )}

              {/* 用户菜单 */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="relative"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">用户菜单</span>
                </Button>

                {/* 下拉菜单 */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-popover p-1 shadow-md">
                    <div className="px-2 py-1.5 text-sm font-medium border-b">
                      {user.email}
                    </div>
                    
                    {/* 移动端显示资产 */}
                    {assetOverview && (
                      <div className="md:hidden px-2 py-2 text-sm border-b">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">总资产</span>
                          <span>{formatCurrency(assetOverview.total_assets)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">可用</span>
                          <span>{formatCurrency(assetOverview.available_balance)}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        toggleTheme();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent sm:hidden"
                    >
                      {theme === 'light' ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                      切换主题
                    </button>

                    <button
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent text-red-500"
                    >
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">登录</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">注册</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 点击外部关闭菜单 */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}
