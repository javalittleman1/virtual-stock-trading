// 用户相关类型
export interface Profile {
  id: string;
  email: string;
  virtual_balance: number;
  created_at: string;
  updated_at: string;
}

// 股票相关类型
export interface Stock {
  symbol: string;
  name: string;
  market: 'A' | 'HK' | 'US';
  current_price: number;
  prev_close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  updated_at: string;
  // 计算字段
  change?: number;
  change_percent?: number;
}

export interface KlineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 持仓相关类型
export interface Portfolio {
  id: string;
  user_id: string;
  stock_symbol: string;
  quantity: number;
  avg_cost: number;
  created_at: string;
  updated_at: string;
  // 关联字段
  stock?: Stock;
  // 计算字段
  market_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
}

// 交易记录类型
export interface Transaction {
  id: string;
  user_id: string;
  stock_symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee: number;
  status: 'filled' | 'cancelled' | 'partial' | 'pending';
  created_at: string;
  // 关联字段
  stock?: Stock;
}

// 订单类型
export interface Order {
  order_id: string;
  symbol: string;
  name?: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  filled_quantity: number;
  status: 'pending' | 'filled' | 'partial' | 'cancelled';
  fee?: number;
  created_at: string;
}

// 自选股类型
export interface WatchlistItem {
  user_id: string;
  stock_symbol: string;
  added_at: string;
  // 关联字段
  stock?: Stock;
}

// 资产概览类型
export interface AssetOverview {
  total_assets: number;
  available_balance: number;
  position_value: number;
  total_profit_loss: number;
  total_profit_loss_percent: number;
  daily_profit_loss: number;
  daily_profit_loss_percent: number;
}

// 交易统计类型
export interface TradeStatistics {
  total_trades: number;
  win_rate: number;
  avg_profit: number;
  avg_loss: number;
  max_profit: number;
  max_loss: number;
  max_drawdown: number;
  sharpe_ratio: number;
}

// 收益走势数据
export interface PerformanceData {
  date: string;
  total_asset: number;
  daily_return: number;
  cumulative_return: number;
  benchmark_return: number;
}

// 策略分析相关类型（P1）
export interface FirstBoardStock {
  symbol: string;
  name: string;
  concepts: string[];
  seal_ratio: number;
}

export interface Signal {
  signal_type: string;
  name: string;
  symbol: string;
  stock_name: string;
  support_price?: number;
  signal_active: boolean;
  updated_at: string;
}

export interface AlertConfig {
  symbol: string;
  pressure_break: boolean;
  tail_confirm: boolean;
  stop_loss_percent: number;
}

// API 响应类型
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// UI 状态类型
export type Theme = 'light' | 'dark';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
