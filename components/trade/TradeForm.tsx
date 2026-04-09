'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Stock } from '@/types';
import { useTradeStore } from '@/stores/useTradeStore';
import { useUserStore } from '@/stores/useUserStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatCurrency } from '@/lib/utils';
import { 
  isTradingHour, 
  getNextTradingTime,
  getUpperLimitPrice,
  getLowerLimitPrice,
  calculateTotalCost,
} from '@/lib/trading-rules';
import { TRADE_CONSTANTS } from '@/lib/constants';
import { AlertCircle } from 'lucide-react';

interface TradeFormProps {
  stock?: Stock;
  defaultType?: 'buy' | 'sell';
}

export function TradeForm({ stock, defaultType = 'buy' }: TradeFormProps) {
  const [type, setType] = useState<'buy' | 'sell'>(defaultType);
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nonTradingConfirm, setNonTradingConfirm] = useState(false); // 非交易时间二次确认状态
  
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
      <div
        className="rounded-[28px] p-6 text-center"
        style={{ background: 'var(--guzhang-bg-app)', border: '1px solid var(--guzhang-border-light)' }}
      >
        <div style={{ color: 'var(--guzhang-text-secondary)' }}>请选择要交易的股票</div>
      </div>
    );
  }

  const currentPrice = stock.current_price;
  const priceNum = parseFloat(price) || 0;
  const quantityNum = parseInt(quantity) || 0;
  
  const upperLimit = getUpperLimitPrice(stock.prev_close, stock.symbol);
  const lowerLimit = getLowerLimitPrice(stock.prev_close, stock.symbol);

  // 计算交易信息（备用）
  void (priceNum > 0 && quantityNum > 0
    ? calculateTotalCost(priceNum, quantityNum, type)
    : null);

  // 最大可买数量
  const maxBuyQuantity = assetOverview 
    ? Math.floor(assetOverview.available_balance / (priceNum || currentPrice) / 100) * 100
    : 0;

  // 最大可卖数量
  const maxSellQuantity = holding?.quantity || 0;

  const handleSubmit = async () => {
    if (!canTrade) {
      if (!nonTradingConfirm) {
        // 第一次点击：显示警告，等待二次确认
        setNonTradingConfirm(true);
        showToast('⚠️ 当前非交易时间！再次点击确认将强制下单（仅测试环境）', 'error');
        // 5秒后自动重置确认状态
        setTimeout(() => setNonTradingConfirm(false), 5000);
        return;
      }
      // 第二次点击：强制下单，重置确认状态
      setNonTradingConfirm(false);
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
      forceNonTrading: !canTrade, // 非交易时间强制标志
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
    <div
      className="rounded-[28px] p-6"
      style={{ background: 'var(--guzhang-bg-app)', border: '1px solid var(--guzhang-border-light)' }}
    >
      {/* 买卖切换 */}
      <div className="flex gap-2 mb-6">
        {(['buy', 'sell'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className="flex-1 py-3 rounded-[40px] font-semibold transition-colors"
            style={{
              background: type === t ? '#1e3a5f' : 'var(--guzhang-stat-bg)',
              color: type === t ? 'white' : 'var(--guzhang-text-secondary)',
            }}
          >
            {t === 'buy' ? '买入' : '卖出'}
          </button>
        ))}
      </div>
  
      {/* 交易时间提示 */}
      {!canTrade && (
        <div
          className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm"
          style={{ background: 'var(--guzhang-warning-bg)', borderLeft: '3px solid var(--guzhang-warning-border)' }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>非交易时间，{getNextTradingTime()}</span>
        </div>
      )}
  
      {/* 股票代码 */}
      <div className="mb-5">
        <label className="text-sm mb-1.5 block" style={{ color: 'var(--guzhang-text-secondary)' }}>股票代码</label>
        <div
          className="w-full px-4 py-4 rounded-[20px] font-medium"
          style={{
            background: 'var(--guzhang-input-bg)',
            border: '1.5px solid var(--guzhang-input-border)',
            color: 'var(--guzhang-text-primary)',
          }}
        >
          {stock.symbol} · {stock.name}
        </div>
      </div>
  
      {/* 委托价格 */}
      <div className="mb-5">
        <label className="text-sm mb-1.5 block" style={{ color: 'var(--guzhang-text-secondary)' }}>委托价格</label>
        <Input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-14 rounded-[20px] text-base px-4"
          style={{
            background: 'var(--guzhang-input-bg)',
            border: '1.5px solid var(--guzhang-input-border)',
            color: 'var(--guzhang-text-primary)',
          }}
          placeholder="请输入价格"
        />
        <div className="flex justify-between mt-1.5 text-xs" style={{ color: 'var(--guzhang-text-secondary)' }}>
          <button onClick={() => setPrice(lowerLimit.toFixed(2))} className="text-[#0f9d6e]">跌停 {lowerLimit.toFixed(2)}</button>
          <button onClick={() => setPrice(upperLimit.toFixed(2))} className="text-[#d83a3a]">涨停 {upperLimit.toFixed(2)}</button>
        </div>
      </div>
  
      {/* 委托数量 */}
      <div className="mb-5">
        <label className="text-sm mb-1.5 block" style={{ color: 'var(--guzhang-text-secondary)' }}>数量 (股)</label>
        <Input
          type="number"
          step="100"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-14 rounded-[20px] text-base px-4"
          style={{
            background: 'var(--guzhang-input-bg)',
            border: '1.5px solid var(--guzhang-input-border)',
            color: 'var(--guzhang-text-primary)',
          }}
          placeholder={`最小单位${TRADE_CONSTANTS.MIN_TRADE_QUANTITY}股`}
        />
      </div>
  
      {/* 提交按鈕 */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !priceNum || !quantityNum}
        className="w-full py-[18px] rounded-[48px] font-bold text-[18px] text-white transition-opacity disabled:opacity-50"
        style={{ background: nonTradingConfirm ? '#c0392b' : '#1e3a5f' }}
      >
        {isSubmitting ? '提交中...' : nonTradingConfirm ? `❗再次确认${type === 'buy' ? '买入' : '卖出'}` : `确认${type === 'buy' ? '买入' : '卖出'}`}
      </button>
  
      {/* 可用资金提示 */}
      <p className="text-center text-sm mt-4" style={{ color: 'var(--guzhang-text-secondary)' }}>
        可用: {formatCurrency(type === 'buy' ? (assetOverview?.available_balance || 0) : (maxSellQuantity * priceNum))} · 手续费万0.025%
      </p>
    </div>
  );
}
