'use client';

import { useState } from 'react';

import { AssetCard } from '@/components/portfolio/AssetCard';
import { PositionList } from '@/components/portfolio/PositionList';
import { StockList } from '@/components/stocks/StockList';
import { TradeForm } from '@/components/trade/TradeForm';
import { Stock } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {

  const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [defaultTradeType, setDefaultTradeType] = useState<'buy' | 'sell'>('buy');

  const handleStockClick = (stock: Stock) => {
    setSelectedStock(stock);
    setDefaultTradeType('buy');
    setIsTradeDialogOpen(true);
  };

  const handlePositionClick = (stock: Stock) => {
    setSelectedStock(stock);
    setDefaultTradeType('sell');
    setIsTradeDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <div className="flex gap-2">
          <Link href="/stocks">
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              行情
            </Button>
          </Link>
          <Link href="/trade">
            <Button variant="outline" size="sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              交易
            </Button>
          </Link>
        </div>
      </div>

      {/* 资产概览 */}
      <AssetCard />

      {/* 主要内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：持仓 */}
        <PositionList 
          onStockClick={handlePositionClick}
          compact
        />

        {/* 右侧：热门股票 */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">热门股票</h3>
            <Link href="/stocks">
              <Button variant="ghost" size="sm">
                查看更多
              </Button>
            </Link>
          </div>
          <StockList 
            onStockClick={handleStockClick}
            showAddButton
          />
        </Card>
      </div>

      {/* 交易弹窗 */}
      <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>快速交易</DialogTitle>
          </DialogHeader>
          <TradeForm 
            stock={selectedStock}
            defaultType={defaultTradeType}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
