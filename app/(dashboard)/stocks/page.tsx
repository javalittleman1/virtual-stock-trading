'use client';

import { useState, useEffect } from 'react';
import { useStockStore } from '@/stores/useStockStore';
import { Stock } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TradeForm } from '@/components/trade/TradeForm';
import { Star, Plus } from 'lucide-react';

// 模拟 K 线数据
const klineHeights = [45, 30, 62, 28, 55, 70, 40, 58, 25, 48, 64, 33];
const klineIsUp = [true, false, true, false, true, true, false, true, false, true, true, false];

export default function StocksPage() {
  const { stocks, watchlist, fetchStocks, fetchWatchlist, addToWatchlist, removeFromWatchlist } = useStockStore();
  const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);

  useEffect(() => {
    fetchStocks();
    fetchWatchlist();
  }, [fetchStocks, fetchWatchlist]);

  const handleStockClick = (stock: Stock) => {
    setSelectedStock(stock);
    setIsTradeDialogOpen(true);
  };

  const isInWatchlist = (symbol: string) =>
    watchlist.some((s) => s.symbol === symbol);

  const handleToggleWatchlist = (e: React.MouseEvent, stock: Stock) => {
    e.stopPropagation();
    if (isInWatchlist(stock.symbol)) {
      removeFromWatchlist(stock.symbol);
    } else {
      addToWatchlist(stock.symbol);
    }
  };

  return (
    <div className="space-y-4">
      {/* 简易 K 线图 */}
      <div
        className="rounded-[24px] overflow-hidden"
        style={{ background: 'var(--guzhang-bg-app)', border: '1px solid var(--guzhang-border-light)' }}
      >
        <div className="flex items-end h-[140px] px-3 pt-3 gap-[6px]">
          {klineHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 min-w-[8px] rounded-t-[4px]"
              style={{
                height: `${h}px`,
                background: klineIsUp[i] ? 'var(--guzhang-candle-up)' : 'var(--guzhang-candle-down)',
              }}
            />
          ))}
        </div>
        <div
          className="flex justify-around px-4 py-2 text-xs"
          style={{ color: 'var(--guzhang-text-secondary)' }}
        >
          {['09:30', '10:30', '11:30', '14:00', '15:00'].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* 热门股票 */}
      <div>
        <div className="flex justify-between items-baseline py-3">
          <h3 className="text-lg font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>📈 热门股票</h3>
          <button className="text-sm text-primary">更多</button>
        </div>

        <div
          className="rounded-[24px] overflow-hidden"
          style={{ background: 'var(--guzhang-card-bg)', border: '1px solid var(--guzhang-card-border)' }}
        >
          {stocks.length === 0 ? (
            <div className="py-8 text-center" style={{ color: 'var(--guzhang-text-secondary)' }}>加载中...</div>
          ) : (
            stocks.map((stock, i) => {
              const isUp = (stock.change_percent ?? 0) >= 0;
              const inWatchlist = isInWatchlist(stock.symbol);
              return (
                <div
                  key={stock.symbol}
                  onClick={() => handleStockClick(stock)}
                  className="flex items-center px-4 py-4 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    borderBottom: i < stocks.length - 1 ? '1px solid var(--guzhang-card-border)' : 'none',
                  }}
                >
                  {/* 左：代码 + 名称 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>{stock.symbol}</div>
                    <div className="text-sm truncate" style={{ color: 'var(--guzhang-text-secondary)' }}>{stock.name}</div>
                  </div>

                  {/* 中：价格 */}
                  <div className="flex-1 text-right font-semibold mr-3" style={{ color: 'var(--guzhang-text-primary)' }}>
                    {(stock.current_price ?? 0).toFixed(2)}
                  </div>

                  {/* 涨跌幅 */}
                  <div
                    className="px-2 py-1 rounded-[24px] text-sm font-semibold mr-2 min-w-[72px] text-center"
                    style={{
                      color: isUp ? 'var(--guzhang-candle-up)' : 'var(--guzhang-candle-down)',
                      background: isUp ? 'rgba(216,58,58,0.1)' : 'rgba(15,157,110,0.1)',
                    }}
                  >
                    {isUp ? '+' : ''}{(stock.change_percent ?? 0).toFixed(2)}%
                  </div>

                  {/* 自选按鈕 */}
                  <button
                    onClick={(e) => handleToggleWatchlist(e, stock)}
                    className="p-1 rounded-full transition-colors"
                    style={{ color: inWatchlist ? '#f59e0b' : 'var(--guzhang-text-secondary)' }}
                  >
                    {inWatchlist ? (
                      <Star className="h-4 w-4 fill-current" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 交易弹窗 */}
      <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>快速交易</DialogTitle>
          </DialogHeader>
          <TradeForm stock={selectedStock} defaultType="buy" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
