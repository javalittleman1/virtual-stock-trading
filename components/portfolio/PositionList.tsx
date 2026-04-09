'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTradeStore } from '@/stores/useTradeStore';
import { useUserStore } from '@/stores/useUserStore';
import { Portfolio, Stock } from '@/types';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercent,
  cn 
} from '@/lib/utils';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PositionListProps {
  onStockClick?: (stock: Stock) => void;
  compact?: boolean;
}

export function PositionList({ onStockClick, compact = false }: PositionListProps) {
  const { holdings, isLoading, fetchHoldings } = useTradeStore();
  const { calculateAssetOverview } = useUserStore();

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  // 当持仓变化时更新资产概览
  useEffect(() => {
    if (holdings.length > 0) {
      calculateAssetOverview(
        holdings.map(h => ({
          quantity: h.quantity,
          avg_cost: h.avg_cost,
          current_price: h.stock?.current_price || h.avg_cost,
        }))
      );
    }
  }, [holdings, calculateAssetOverview]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">我的持仓</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (holdings.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">我的持仓</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>暂无持仓</p>
          <Link href="/stocks">
            <Button variant="link" className="mt-2">
              去选股 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">我的持仓</h3>
          <Link href="/portfolio">
            <Button variant="ghost" size="sm">
              查看全部
            </Button>
          </Link>
        </div>
        <div className="space-y-2">
          {holdings.slice(0, 3).map((holding) => (
            <CompactPositionItem 
              key={holding.id} 
              holding={holding} 
              onClick={() => holding.stock && onStockClick?.(holding.stock)}
            />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">我的持仓 ({holdings.length})</h3>
      <div className="space-y-3">
        {holdings.map((holding) => (
          <PositionItem 
            key={holding.id} 
            holding={holding}
            onClick={() => holding.stock && onStockClick?.(holding.stock)}
          />
        ))}
      </div>
    </Card>
  );
}

function PositionItem({ 
  holding, 
  onClick 
}: { 
  holding: Portfolio; 
  onClick?: () => void;
}) {
  const profitLoss = holding.profit_loss || 0;
  const profitLossPercent = holding.profit_loss_percent || 0;
  const marketValue = holding.market_value || 0;
  const isProfit = profitLoss >= 0;

  return (
    <div 
      className={cn(
        "p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{holding.stock?.name || holding.stock_symbol}</span>
            <span className="text-sm text-muted-foreground">{holding.stock_symbol}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {formatNumber(holding.quantity)}股 | 成本 {formatCurrency(holding.avg_cost)}
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-medium">{formatCurrency(marketValue)}</div>
          <div className={cn(
            "text-sm flex items-center justify-end gap-1",
            isProfit ? "text-red-500" : "text-green-500"
          )}>
            {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isProfit ? '+' : ''}{formatCurrency(profitLoss)}</span>
            <span>({formatPercent(profitLossPercent)})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactPositionItem({ 
  holding, 
  onClick 
}: { 
  holding: Portfolio; 
  onClick?: () => void;
}) {
  const profitLossPercent = holding.profit_loss_percent || 0;
  const isProfit = profitLossPercent >= 0;

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{holding.stock?.name || holding.stock_symbol}</div>
        <div className="text-xs text-muted-foreground">
          {formatNumber(holding.quantity)}股
        </div>
      </div>
      <div className={cn(
        "text-sm font-medium",
        isProfit ? "text-red-500" : "text-green-500"
      )}>
        {formatPercent(profitLossPercent)}
      </div>
    </div>
  );
}
