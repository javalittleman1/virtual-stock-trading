'use client';

import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTradeStore } from '@/stores/useTradeStore';
import { useStockStore } from '@/stores/useStockStore';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isInitialized } = useAuthStore();
  const { subscribeProfile } = useUserStore();
  const { subscribeHoldings, subscribeOrders } = useTradeStore();
  const { subscribePrices } = useStockStore();
  const { sidebarCollapsed, setIsMobile } = useUIStore();

  // 初始化认证状态
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  // 设置移动端检测
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  // 订阅实时数据
  useEffect(() => {
    if (!user?.id) return;

    // 加载初始数据
    useUserStore.getState().fetchProfile();
    useTradeStore.getState().fetchHoldings();
    useStockStore.getState().fetchWatchlist();

    // 建立实时订阅
    const unsubProfile = subscribeProfile(user.id);
    const unsubHoldings = subscribeHoldings(user.id);
    const unsubOrders = subscribeOrders(user.id);
    const unsubPrices = subscribePrices();

    return () => {
      unsubProfile();
      unsubHoldings();
      unsubOrders();
      unsubPrices();
    };
  }, [user?.id, subscribeProfile, subscribeHoldings, subscribeOrders, subscribePrices]);

  // 未登录时不渲染（中间件会处理重定向）
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <Header />

      {/* 侧边栏（桌面端） */}
      <Sidebar />

      {/* 主内容区 */}
      <main
        className={cn(
          "transition-all duration-300",
          "pt-14 pb-16 lg:pb-0", // 为顶部导航和底部导航留出空间
          "lg:ml-56", // 桌面端为侧边栏留出空间
          sidebarCollapsed && "lg:ml-16" // 侧边栏折叠时
        )}
      >
        <div className="container p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* 底部导航（移动端） */}
      <BottomNav />
    </div>
  );
}
