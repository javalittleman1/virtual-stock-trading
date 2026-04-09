'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stock, Portfolio } from '@/types';
import { useTradeStore } from '@/stores/useTradeStore';
import { useUserStore } from '@/stores/useUserStore';
import { useUIStore } from '@/stores/useUIStore';
import { 
  formatCurrency, 
  formatNumber,
  cn 
} from '@/lib/utils';
import { 
  isTradingHour, 
  getNextTradingTime,
  getUpperLimitPrice,
  getLowerLimitPrice,
  calculateTotalCost,
} from '@/lib/trading-rules';
import { TRADE_CONSTANTS } from '@/lib/constants';
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';

interface TradeFormProps {
  stock?: Stock;
  defaultType?: 'buy' | 'sell';
}

export function TradeForm({ stock, defaultType = 'buy' }: TradeFormProps) {
  const [type, setType] = useState<'buy' | 'sell'>(defaultType);
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { submitOrder, getHoldingBySymbol } = useTradeStore();
  const { assetOverview } = useUserStore();
  const { showToast } = useUIStore();

  const holding = stock ? getHoldingBySymbol(stock.symbol) : undefined;
  const canTrade = isTradingHour();

  // 设置默认价格
  useEffect(() => {
    if (stock) {
      setPrice(stock.current_price.toFixed(2));
    }
  }, [stock]);

  // 当切换类型时重置表单
  useEffect(() => {
    if (stock) {
      setPrice(stock.current_price.toFixed(2));
      setQuantity('');
    }
  }, [type, stock]);

  if (!stock) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          请选择要交易的股票
        </div>
      </Card>
    );
  }

  const currentPrice = stock.current_price;
  const priceNum = parseFloat(price) || 0;
  const quantityNum = parseInt(quantity) || 0;
  
  const upperLimit = getUpperLimitPrice(stock.prev_close, stock.symbol);
  const lowerLimit = getLowerLimitPrice(stock.prev_close, stock.symbol);

  // 计算交易信息
  const tradeInfo = priceNum > 0 && quantityNum > 0
    ? calculateTotalCost(priceNum, quantityNum, type)
    : null;

  // 最大可买数量
  const maxBuyQuantity = assetOverview 
    ? Math.floor(assetOverview.available_balance / (priceNum || currentPrice) / 100) * 100
    : 0;

  // 最大可卖数量
  const maxSellQuantity = holding?.quantity || 0;

  const handleSubmit = async () => {
    if (!canTrade) {
      showToast('非交易时间，无法下单', 'error');
      return;
    }

    if (!priceNum || !quantityNum) {
      showToast('请输入价格和数量', 'error');
      return;
    }

    if (quantityNum % TRADE_CONSTANTS.MIN_TRADE_QUANTITY !== 0) {
      showToast(`数量必须是${TRADE_CONSTANTS.MIN_TRADE_QUANTITY}股的整数倍`, 'error');
      return;
    }

    if (type === 'buy' && quantityNum > maxBuyQuantity) {
      showToast('可用资金不足', 'error');
      return;
    }

    if (type === 'sell' && quantityNum > maxSellQuantity) {
      showToast('持仓数量不足', 'error');
      return;
    }

    setIsSubmitting(true);
    
    const result = await submitOrder({
      symbol: stock.symbol,
      type,
      price: priceNum,
      quantity: quantityNum,
    });

    setIsSubmitting(false);

    if (result.success) {
      showToast(`${type === 'buy' ? '买入' : '卖出'}委托已成交`, 'success');
      setQuantity('');
    } else {
      showToast(result.error || '下单失败', 'error');
    }
  };

  return (
    <Card className="p-4">
      {/* 股票信息 */}
      <div className="mb-4 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{stock.name}</h3>
            <p className="text-sm text-muted-foreground">{stock.symbol}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(currentPrice)}</div>
            <div className={cn(
              "text-sm",
              stock.current_price >= stock.prev_close ? "text-red-500" : "text-green-500"
            )}>
              {stock.current_price >= stock.prev_close ? '+' : ''}
              {((stock.current_price - stock.prev_close) / stock.prev_close * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* 交易时间提示 */}
      {!canTrade && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <span>非交易时间，{getNextTradingTime()}</span>
        </div>
      )}

      {/* 买卖类型切换 */}
      <Tabs value={type} onValueChange={(v) => setType(v as 'buy' | 'sell')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="buy"
            className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
          >
            买入
          </TabsTrigger>
          <TabsTrigger 
            value="sell"
            className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
          >
            卖出
          </TabsTrigger>
        </TabsList>

        <TabsContent value={type} className="mt-4 space-y-4">
          {/* 可用资金/持仓 */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {type === 'buy' ? '可用资金' : '可卖数量'}
            </span>
            <span className="font-medium">
              {type === 'buy' 
                ? formatCurrency(assetOverview?.available_balance || 0)
                : formatNumber(maxSellQuantity) + '股'
              }
            </span>
          </div>

          {/* 价格输入 */}
          <div className="space-y-2">
            <Label htmlFor="price">委托价格</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPrice(lowerLimit.toFixed(2))}
                className="text-green-600"
              >
                <ArrowDown className="h-3 w-3 mr-1" />
                跌停
              </Button>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1"
                placeholder="请输入价格"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPrice(upperLimit.toFixed(2))}
                className="text-red-600"
              >
                <ArrowUp className="h-3 w-3 mr-1" />
                涨停
              </Button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>跌停: {formatCurrency(lowerLimit)}</span>
              <span>涨停: {formatCurrency(upperLimit)}</span>
            </div>
          </div>

          {/* 数量输入 */}
          <div className="space-y-2">
            <Label htmlFor="quantity">委托数量</Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                type="number"
                step="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1"
                placeholder={`最小单位${TRADE_CONSTANTS.MIN_TRADE_QUANTITY}股`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity(type === 'buy' ? maxBuyQuantity.toString() : maxSellQuantity.toString())}
              >
                全仓
              </Button>
            </div>
          </div>

          {/* 交易概览 */}
          {tradeInfo && (
            <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">成交金额</span>
                <span>{formatCurrency(tradeInfo.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">手续费</span>
                <span>{formatCurrency(tradeInfo.fee)}</span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>{type === 'buy' ? '应付总额' : '实收金额'}</span>
                <span className={type === 'buy' ? 'text-red-500' : 'text-green-500'}>
                  {formatCurrency(tradeInfo.total)}
                </span>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            onClick={handleSubmit}
            disabled={!canTrade || isSubmitting || !priceNum || !quantityNum}
            className={cn(
              "w-full",
              type === 'buy' 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-green-500 hover:bg-green-600"
            )}
            size="lg"
          >
            {isSubmitting ? '提交中...' : (type === 'buy' ? '买入' : '卖出')}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
