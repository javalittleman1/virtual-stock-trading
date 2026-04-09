'use client';

import { Stock } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';
import { useStockStore } from '@/stores/useStockStore';
import { useUIStore } from '@/stores/useUIStore';

interface StockCardProps {
  stock: Stock;
  showAddButton?: boolean;
  isInWatchlist?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function StockCard({ 
  stock, 
  showAddButton = false, 
  isInWatchlist = false,
  onClick,
  compact = false 
}: StockCardProps) {
  const { addToWatchlist, removeFromWatchlist } = useStockStore();
  const { showToast } = useUIStore();

  const change = stock.change || (stock.current_price - stock.prev_close);
  const changePercent = stock.change_percent || 
    (stock.prev_close > 0 ? (change / stock.prev_close) * 100 : 0);
  const isUp = change >= 0;

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isInWatchlist) {
      const result = await removeFromWatchlist(stock.symbol);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('已从自选股移除', 'success');
      }
    } else {
      const result = await addToWatchlist(stock.symbol);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('已添加到自选股', 'success');
      }
    }
  };

  if (compact) {
    return (
      <Card 
        className={cn(
          "p-3 cursor-pointer hover:shadow-md transition-shadow",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{stock.name}</div>
            <div className="text-sm text-muted-foreground">{stock.symbol}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(stock.current_price)}</div>
            <div className={cn(
              "text-sm flex items-center justify-end gap-1",
              isUp ? "text-red-500" : "text-green-500"
            )}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercent(changePercent)}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-shadow",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{stock.name}</h3>
            <span className="text-sm text-muted-foreground">{stock.symbol}</span>
          </div>
          
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">今开: </span>
              <span>{formatCurrency(stock.open)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">昨收: </span>
              <span>{formatCurrency(stock.prev_close)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">最高: </span>
              <span className="text-red-500">{formatCurrency(stock.high)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">最低: </span>
              <span className="text-green-500">{formatCurrency(stock.low)}</span>
            </div>
          </div>
        </div>

        <div className="text-right ml-4">
          <div className="text-2xl font-bold">
            {formatCurrency(stock.current_price)}
          </div>
          <div className={cn(
            "text-lg flex items-center justify-end gap-1 mt-1",
            isUp ? "text-red-500" : "text-green-500"
          )}>
            {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{change > 0 ? '+' : ''}{change.toFixed(2)}</span>
            <span>({formatPercent(changePercent)})</span>
          </div>
          
          {showAddButton && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={handleWatchlistToggle}
            >
              <Star className={cn(
                "h-4 w-4",
                isInWatchlist && "fill-yellow-400 text-yellow-400"
              )} />
              <span className="ml-1">{isInWatchlist ? '已关注' : '关注'}</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
