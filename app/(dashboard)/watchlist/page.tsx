'use client';

import { useEffect } from 'react';
import { StockCard } from '@/components/stocks/StockCard';
import { useStockStore } from '@/stores/useStockStore';
import { useUIStore } from '@/stores/useUIStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WatchlistPage() {
  const { watchlist, fetchWatchlist, isLoading } = useStockStore();
  const { isMobile } = useUIStore();

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">自选股</h1>
            <p className="text-sm text-muted-foreground">
              关注您感兴趣的股票，实时追踪行情变化
            </p>
          </div>
        </div>
        <Link href="/stocks">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            去选股
          </Button>
        </Link>
      </div>

      {/* 自选股列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">暂无自选股</h3>
          <p className="text-muted-foreground mb-4">
            添加您感兴趣的股票到自选列表，方便快速查看
          </p>
          <Link href="/stocks">
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              去添加股票
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              showAddButton
              isInWatchlist={true}
              compact={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
