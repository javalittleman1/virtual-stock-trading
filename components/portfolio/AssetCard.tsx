'use client';

import { Card } from '@/components/ui/card';
import { useUserStore } from '@/stores/useUserStore';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  DollarSign
} from 'lucide-react';

export function AssetCard() {
  const { assetOverview, isLoading } = useUserStore();

  if (isLoading || !assetOverview) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 h-24 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: '总资产',
      value: assetOverview.total_assets,
      icon: Wallet,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: '可用资金',
      value: assetOverview.available_balance,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: '持仓市值',
      value: assetOverview.position_value,
      icon: PieChart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: '累计盈亏',
      value: assetOverview.total_profit_loss,
      percent: assetOverview.total_profit_loss_percent,
      icon: assetOverview.total_profit_loss >= 0 ? TrendingUp : TrendingDown,
      color: assetOverview.total_profit_loss >= 0 ? 'text-red-500' : 'text-green-500',
      bgColor: assetOverview.total_profit_loss >= 0 
        ? 'bg-red-50 dark:bg-red-950' 
        : 'bg-green-50 dark:bg-green-950',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={cn("text-xl font-bold mt-1", card.color)}>
                  {formatCurrency(card.value)}
                </p>
                {card.percent !== undefined && (
                  <p className={cn(
                    "text-sm mt-1",
                    card.percent >= 0 ? "text-red-500" : "text-green-500"
                  )}>
                    {card.percent >= 0 ? '+' : ''}{card.percent.toFixed(2)}%
                  </p>
                )}
              </div>
              <div className={cn("p-2 rounded-lg", card.bgColor)}>
                <Icon className={cn("h-5 w-5", card.color)} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
