'use client';

import { useState } from 'react';
import { TradeForm } from '@/components/trade/TradeForm';
import { TradeHistory } from '@/components/trade/TradeHistory';
import { StockList } from '@/components/stocks/StockList';
import { Stock } from '@/types';
import { Wallet, TrendingUp, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export default function TradePage() {
  const [selectedStock, setSelectedStock] = useState<Stock | undefined>();

  const handleStockClick = (stock: Stock) => {
    setSelectedStock(stock);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">交易下单</h1>
          <p className="text-sm text-muted-foreground">
            买入或卖出股票，快速执行交易
          </p>
        </div>
      </div>

      {/* 交易区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：交易表单 */}
        <div className="lg:col-span-1">
          <TradeForm stock={selectedStock} />
        </div>

        {/* 右侧：股票列表和交易记录 */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="stocks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stocks">
                <TrendingUp className="h-4 w-4 mr-2" />
                选择股票
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                委托记录
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stocks" className="mt-4">
              <Card className="p-4">
                <StockList 
                  onStockClick={handleStockClick}
                  showAddButton
                />
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <TradeHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
