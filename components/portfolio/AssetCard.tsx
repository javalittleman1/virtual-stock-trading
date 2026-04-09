'use client';

import { useUserStore } from '@/stores/useUserStore';
import { formatCurrency } from '@/lib/utils';
import { Eye } from 'lucide-react';

export function AssetCard() {
  const { assetOverview, isLoading } = useUserStore();

  const totalAssets = assetOverview?.total_assets ?? 0;
  const availableBalance = assetOverview?.available_balance ?? 0;
  const positionValue = assetOverview?.position_value ?? 0;
  const todayPnl = assetOverview?.daily_profit_loss ?? 0;

  if (isLoading) {
    return (
      <div
        className="rounded-[28px] mx-0 p-5 h-36 animate-pulse"
        style={{ background: 'var(--guzhang-asset-gradient)' }}
      />
    );
  }

  return (
    <div
      className="rounded-[28px] p-5 text-white"
      style={{ background: 'var(--guzhang-asset-gradient)' }}
    >
      {/* 标题行 */}
      <div className="flex justify-between items-center opacity-90 mb-1">
        <span className="text-sm">总资产</span>
        <Eye className="h-4 w-4" />
      </div>

      {/* 总资产金额 */}
      <div className="text-[34px] font-bold mb-3 leading-tight">
        {formatCurrency(totalAssets)}
      </div>

      {/* 小指标 */}
      <div className="flex gap-5 text-sm flex-wrap">
        <div className="flex gap-1">
          <span className="opacity-80">可用</span>
          <span className="font-medium">{formatCurrency(availableBalance)}</span>
        </div>
        <div className="flex gap-1">
          <span className="opacity-80">市值</span>
          <span className="font-medium">{formatCurrency(positionValue)}</span>
        </div>
        <div className="flex gap-1">
          <span className="opacity-80">今日</span>
          <span
            className="font-medium"
            style={{ color: todayPnl >= 0 ? '#ff7b7b' : '#4ade80' }}
          >
            {todayPnl >= 0 ? '+' : ''}{formatCurrency(todayPnl)}
          </span>
        </div>
      </div>
    </div>
  );
}
