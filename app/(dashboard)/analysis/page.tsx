'use client';

import { useState, useEffect } from 'react';

interface Signal {
  icon: string;
  name: string;
  code: string;
  support?: string;
  resist?: string;
  breakPoint?: string;
  ma10?: boolean;
  label?: string;
}

interface UserStats {
  total_trades: number;
  win_rate: number;
  total_return_rate: number;
}

const signals: Signal[] = [
  { icon: '🔥', name: '三阴不破阳', code: '600519', support: '1680.00' },
  { icon: '✂️', name: '涨停揉搜线', code: '300750', resist: '210.00' },
  { icon: '⏳', name: '倍量阴买点', code: '002594', breakPoint: '252.00' },
  { icon: '🔄', name: 'N字涨停', code: '000858', ma10: true },
  { icon: '🚀', name: '高位反包', code: '601318', label: '反包板' },
];

const firstBoard = [
  { sym: '002456', name: '欧菲光', ratio: '3.2%' },
  { sym: '300418', name: '昆仑万维', ratio: '5.1%' },
];

export default function AnalysisPage() {
  const [alerts, setAlerts] = useState({ pressure: true, tail: false, stop: true });
  const [modalSignal, setModalSignal] = useState<Signal | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetch('/api/user/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  const toggleAlert = (key: keyof typeof alerts) => {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 模拟K线高度数组
  const randomBars = (count: number) =>
    Array.from({ length: count }, () => Math.floor(20 + Math.random() * 60));

  return (
    <div className="space-y-4 pb-4">
      {/* 风险提示 */}
      <div
        className="flex items-start gap-2 p-4 rounded-xl text-sm"
        style={{
          background: 'var(--guzhang-warning-bg)',
          borderLeft: '4px solid var(--guzhang-warning-border)',
        }}
      >
        <span>⚠️</span>
        <span style={{ color: 'var(--guzhang-text-secondary)' }}>
          追涨杀跌风险极大，本工具识别的是历史形态特征，不代表未来收益。
        </span>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '交易次数', value: stats ? `${stats.total_trades}` : '--', color: '' },
          { label: '胜率', value: stats ? `${stats.win_rate.toFixed(1)}%` : '--', color: '#0f9d6e' },
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

      {/* 首板观察池 */}
      <div>
        <div className="flex justify-between items-baseline py-3">
          <h3 className="text-lg font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>🔥 首板观察池</h3>
          <button className="text-sm text-primary">刷新</button>
        </div>
        <div
          className="rounded-[24px] overflow-hidden"
          style={{ background: 'var(--guzhang-card-bg)', border: '1px solid var(--guzhang-card-border)' }}
        >
          {firstBoard.map((s, i) => (
            <div
              key={s.sym}
              className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: i < firstBoard.length - 1 ? '1px solid var(--guzhang-card-border)' : 'none' }}
            >
              <div>
                <div className="font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>{s.sym}</div>
                <div className="text-sm" style={{ color: 'var(--guzhang-text-secondary)' }}>{s.name}</div>
              </div>
              <div className="text-sm" style={{ color: 'var(--guzhang-text-secondary)' }}>
                封单/流通 {s.ratio}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 五大回调战法 */}
      <div>
        <div className="flex justify-between items-baseline py-3">
          <h3 className="text-lg font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>📊 五大回调战法</h3>
          <button className="text-sm text-primary">回测</button>
        </div>
        <div className="space-y-3">
          {signals.map((s) => {
            const bars = randomBars(12);
            return (
              <div
                key={s.name}
                className="rounded-[24px] overflow-hidden"
                style={{ background: 'var(--guzhang-card-bg)', border: '1px solid var(--guzhang-card-border)' }}
              >
                {/* 卡片头 */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ background: 'var(--guzhang-stat-bg)', borderBottom: '1px solid var(--guzhang-card-border)' }}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>
                      {s.name} · {s.code}
                    </div>
                  </div>
                  <button
                    onClick={() => setModalSignal(s)}
                    className="px-2 py-0.5 rounded-full text-xs text-primary"
                    style={{ background: 'rgba(37,99,235,0.12)' }}
                  >
                    详情
                  </button>
                </div>

                {/* mini K线 */}
                <div className="px-3 pt-3 pb-4">
                  <div className="flex items-end gap-1 h-[80px] mb-2">
                    {bars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 min-w-[6px] rounded-sm"
                        style={{
                          height: `${h}px`,
                          background: i % 2 === 0 ? 'var(--guzhang-candle-up)' : 'var(--guzhang-candle-down)',
                        }}
                      />
                    ))}
                  </div>
                  {/* 标注 */}
                  <div className="flex flex-col gap-1.5">
                    {s.support && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--guzhang-text-secondary)' }}>
                        <span className="w-6 h-[2px] rounded" style={{ background: 'var(--guzhang-support-line)' }} />
                        支撑 {s.support}
                      </div>
                    )}
                    {s.resist && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--guzhang-text-secondary)' }}>
                        <span className="w-6 h-[2px] rounded bg-blue-500" />
                        压力 {s.resist}
                      </div>
                    )}
                    {s.breakPoint && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--guzhang-text-secondary)' }}>
                        <span className="w-6 h-[2px] rounded bg-yellow-500" />
                        突破位 {s.breakPoint} ↑
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 智能预警 */}
      <div>
        <div className="py-3">
          <h3 className="text-lg font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>⚙️ 智能预警</h3>
        </div>
        <div
          className="rounded-[20px] p-4 space-y-4"
          style={{ background: 'var(--guzhang-card-bg)', border: '1px solid var(--guzhang-card-border)' }}
        >
          {[
            { key: 'pressure' as const, label: '📈 股价突破策略指定压力线' },
            { key: 'tail' as const, label: '⏰ 尾盘确认信号 (14:50推送)' },
          ].map(({ key, label }) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--guzhang-text-primary)' }}>{label}</span>
              <button
                onClick={() => toggleAlert(key)}
                className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: alerts[key] ? '#2563eb' : '#ccc' }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: alerts[key] ? '24px' : '4px' }}
                />
              </button>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--guzhang-text-primary)' }}>🛡️ 跌破预设止损位</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={5}
                className="w-14 rounded-xl px-2 py-1 text-sm text-center"
                style={{
                  background: 'var(--guzhang-input-bg)',
                  border: '1px solid var(--guzhang-input-border)',
                  color: 'var(--guzhang-text-primary)',
                }}
              />
              <span className="text-sm" style={{ color: 'var(--guzhang-text-secondary)' }}>%</span>
              <button
                onClick={() => toggleAlert('stop')}
                className="w-11 h-6 rounded-full relative transition-colors"
                style={{ background: alerts.stop ? '#2563eb' : '#ccc' }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: alerts.stop ? '24px' : '4px' }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 信号日历 */}
      <div>
        <div className="py-3">
          <h3 className="text-lg font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>📅 信号日历</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['04-07 6只', '04-08 9只', '04-09 8只'].map((d) => (
            <span
              key={d}
              className="px-3 py-1 rounded-full text-sm text-primary"
              style={{ background: 'rgba(37,99,235,0.12)' }}
            >
              📅 {d}
            </span>
          ))}
        </div>
      </div>

      {/* 详情弹窗 */}
      {modalSignal && (
        <div
          className="fixed inset-0 z-[2000] flex items-end lg:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setModalSignal(null)}
        >
          <div
            className="w-full max-w-[480px] lg:max-w-[600px] rounded-t-[32px] lg:rounded-[32px] p-6 overflow-y-auto max-h-[80vh]"
            style={{ background: 'var(--guzhang-bg-app)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-lg font-bold" style={{ color: 'var(--guzhang-text-primary)' }}>
                {modalSignal.name} · {modalSignal.code}
              </h4>
              <button
                onClick={() => setModalSignal(null)}
                className="text-2xl"
                style={{ color: 'var(--guzhang-text-secondary)' }}
              >×</button>
            </div>
            {/* K线 */}
            <div className="rounded-[20px] p-4 mb-4" style={{ background: 'var(--guzhang-card-bg)' }}>
              <div className="flex items-end gap-1 h-[100px]">
                {randomBars(16).map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}px`,
                      background: i % 2 === 0 ? 'var(--guzhang-candle-up)' : 'var(--guzhang-candle-down)',
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => setModalSignal(null)}
              className="w-full py-4 rounded-[48px] text-white font-bold text-lg"
              style={{ background: '#1e3a5f' }}
            >
              加入监控列表
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
