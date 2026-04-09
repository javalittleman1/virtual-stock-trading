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
import { AssetCard } from '@/components/portfolio/AssetCard';
import { UI_CONSTANTS } from '@/lib/constants';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isInitialized } = useAuthStore();
  const { calculateAssetOverview, subscribeProfile } = useUserStore();
  const { holdings, subscribeHoldings, subscribeOrders } = useTradeStore();
  const { subscribePrices } = useStockStore();
  const { setIsMobile } = useUIStore();

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
    const init = async () => {
      await useUserStore.getState().fetchProfile();
      await useTradeStore.getState().fetchHoldings();
      await useStockStore.getState().fetchWatchlist();
      await useStockStore.getState().fetchStocks();

      // 计算资产概览
      const { holdings: h } = useTradeStore.getState();
      if (h.length > 0) {
        const positions = h.map(p => ({
          quantity: p.quantity,
          avg_cost: p.avg_cost,
          current_price: p.stock?.current_price ?? p.avg_cost,
        }));
        useUserStore.getState().calculateAssetOverview(positions);
      } else {
        // 没有持仓时，也要初始化资产概览（全部为可用余额）
        useUserStore.getState().calculateAssetOverview([]);
      }
    };

    init();

    // 建立实时订阅
    const unsubProfile = subscribeProfile(user.id);
    const unsubHoldings = subscribeHoldings(user.id);
    const unsubOrders = subscribeOrders(user.id);
    const unsubPrices = subscribePrices();

    // 定时刷新行情（每 30 秒轮换更新 3 只，遇到末尾则重新从头）
    let priceUpdateOffset = 0;
    const priceTimer = setInterval(async () => {
      // 轮换调用 update-prices，每次更新 3 只
      try {
        const res = await fetch(`/api/cron/update-prices?force=1&offset=${priceUpdateOffset}&limit=3`);
        const data = await res.json();
        if (data.nextOffset !== undefined) {
          priceUpdateOffset = data.nextOffset; // 下次从这里继续
        }
      } catch { /* 忽略错误 */ }
      // 刷新前端显示的 stocks
      await useStockStore.getState().fetchStocks();
      // 刷新后重新计算资产
      const { holdings: h } = useTradeStore.getState();
      const positions = h.map(p => ({
        quantity: p.quantity,
        avg_cost: p.avg_cost,
        current_price: p.stock?.current_price ?? p.avg_cost,
      }));
      useUserStore.getState().calculateAssetOverview(positions);
    }, UI_CONSTANTS.REFRESH_INTERVAL);

    return () => {
      unsubProfile();
      unsubHoldings();
      unsubOrders();
      unsubPrices();
      clearInterval(priceTimer);
    };
  }, [user?.id, subscribeProfile, subscribeHoldings, subscribeOrders, subscribePrices]);

  // 当持仓变化时重新计算资产概览
  useEffect(() => {
    if (!holdings.length) return;
    const positions = holdings.map(p => ({
      quantity: p.quantity,
      avg_cost: p.avg_cost,
      current_price: p.stock?.current_price ?? p.avg_cost,
    }));
    calculateAssetOverview(positions);
  }, [holdings, calculateAssetOverview]);

  // 未初始化时显示 loading
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--guzhang-bg-body)' }}
    >
      {/* 顶部导航 */}
      <Header />

      {/* 主体区域：桌面端侧边栏 + 内容 */}
      <div className="flex flex-1">
        {/* 左侧边栏（桌面端） */}
        <Sidebar />

        {/* 主内容区 */}
        <main className="flex-1 min-w-0">
          <div
            className="mx-auto max-w-[900px] px-4 py-4 pb-24 lg:pb-6"
          >
            {/* 资产卡片 */}
            <div className="mb-4">
              <AssetCard />
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* 底部导航（移动端） */}
      <BottomNav />
    </div>
  );
}
