'use client';

import { PositionList } from '@/components/portfolio/PositionList';
import { TradeHistory } from '@/components/trade/TradeHistory';
import { useUserStore } from '@/stores/useUserStore';
import { Stock } from '@/types';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TradeForm } from '@/components/trade/TradeForm';
import { useAuthStore } from '@/stores/useAuthStore';

export default function PortfolioPage() {
  const [selectedStock, setSelectedStock] = useState<Stock | undefined>();
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'holdings' | 'history'>('holdings');
  const { assetOverview } = useUserStore();
  const { signOut } = useAuthStore();

  const handleStockClick = (stock: Stock) => {
    setSelectedStock(stock);
    setIsTradeDialogOpen(true);
  };

  const totalReturn = assetOverview
    ? ((assetOverview.total_profit_loss / (assetOverview.total_assets - assetOverview.total_profit_loss)) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '累计收益率', value: `+${totalReturn}%`, color: '#0f9d6e' },
          { label: '最大回撤', value: '-8.32%', color: '#d83a3a' },
          { label: '胜率', value: '62.5%', color: '' },
          { label: '交易次数', value: '48', color: '' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[20px] p-4"
            style={{
              background: 'var(--guzhang-stat-bg)',
              border: '1px solid var(--guzhang-border-light)',
            }}
          >
            <div className="text-sm mb-1" style={{ color: 'var(--guzhang-text-secondary)' }}>{s.label}</div>
            <div
              className="text-[28px] font-bold"
              style={{ color: s.color || 'var(--guzhang-text-primary)' }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* 收益走势占位符 */}
      <div
        className="rounded-[24px] p-4"
        style={{ background: 'var(--guzhang-bg-app)', border: '1px solid var(--guzhang-border-light)' }}
      >
        <p className="text-sm mb-2" style={{ color: 'var(--guzhang-text-secondary)' }}>收益走势 (对比沪淳300)</p>
        <div className="h-12 bg-muted/30 rounded-lg flex items-center justify-center">
          <span className="text-xs" style={{ color: 'var(--guzhang-text-secondary)' }}>图表展示区域</span>
        </div>
      </div>

      {/* 持仓和记录 Tab */}
      <div>
        <div className="flex gap-3 mb-4">
          {(['holdings', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-[40px] font-semibold text-sm transition-colors"
              style={{
                background: activeTab === tab ? '#1e3a5f' : 'var(--guzhang-stat-bg)',
                color: activeTab === tab ? 'white' : 'var(--guzhang-text-secondary)',
              }}
            >
              {tab === 'holdings' ? '当前持仓' : '交易记录'}
            </button>
          ))}
        </div>

        {activeTab === 'holdings' ? (
          <PositionList onStockClick={handleStockClick} />
        ) : (
          <TradeHistory />
        )}
      </div>

      {/* 退出按鈕 */}
      <button
        onClick={signOut}
        className="w-full py-2.5 rounded-[30px] text-sm"
        style={{
          border: '1px solid var(--guzhang-border-light)',
          color: 'var(--guzhang-text-secondary)',
        }}
      >
        退出登录
      </button>

      {/* 交易弹窗 */}
      <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>快速交易</DialogTitle>
          </DialogHeader>
          <TradeForm stock={selectedStock} defaultType="sell" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
