// 交易相关常量
export const TRADE_CONSTANTS = {
  // 初始虚拟资金
  INITIAL_BALANCE: Number(process.env.NEXT_PUBLIC_INITIAL_BALANCE) || 1000000,
  
  // 交易手续费率（万分之2.5）
  FEE_RATE: Number(process.env.NEXT_PUBLIC_TRADE_FEE_RATE) || 0.00025,
  
  // 最低手续费（元）
  MIN_FEE: Number(process.env.NEXT_PUBLIC_MIN_TRADE_FEE) || 5,
  
  // 印花税率（卖出时单边收取，万分之5）
  STAMP_TAX_RATE: Number(process.env.NEXT_PUBLIC_STAMP_TAX_RATE) || 0.0005,
  
  // 最小交易单位（股）
  MIN_TRADE_QUANTITY: 100,
  
  // 涨跌停限制
  PRICE_LIMIT_PERCENT: 0.1, // 10% for 主板
  PRICE_LIMIT_PERCENT_KC: 0.2, // 20% for 科创板/创业板
  
  // 交易时间
  MORNING_START: 930,  // 9:30
  MORNING_END: 1130,   // 11:30
  AFTERNOON_START: 1300, // 13:00
  AFTERNOON_END: 1500,   // 15:00
} as const;

// A股股票代码规则
export const STOCK_RULES = {
  // 沪市主板：600/601/603/605开头
  SH_MAIN_PATTERN: /^6\d{5}$/,
  
  // 沪市科创板：688开头
  SH_KC_PATTERN: /^688\d{3}$/,
  
  // 深市主板：000/001/002/003开头
  SZ_MAIN_PATTERN: /^0\d{5}$/,
  
  // 深市创业板：300/301开头
  SZ_CY_PATTERN: /^30\d{4}$/,
  
  // 北交所：43/83/87开头
  BSE_PATTERN: /^(43|83|87)\d{3}$/,
} as const;

// 判断股票类型
export function getStockType(symbol: string): 'main' | 'kc' | 'cy' | 'bse' | 'unknown' {
  if (STOCK_RULES.SH_KC_PATTERN.test(symbol) || STOCK_RULES.SZ_CY_PATTERN.test(symbol)) {
    return 'kc';
  }
  if (STOCK_RULES.SH_MAIN_PATTERN.test(symbol) || STOCK_RULES.SZ_MAIN_PATTERN.test(symbol)) {
    return 'main';
  }
  if (STOCK_RULES.BSE_PATTERN.test(symbol)) {
    return 'bse';
  }
  return 'unknown';
}

// 获取涨跌停限制比例
export function getPriceLimitPercent(symbol: string): number {
  const type = getStockType(symbol);
  if (type === 'kc') {
    return TRADE_CONSTANTS.PRICE_LIMIT_PERCENT_KC;
  }
  return TRADE_CONSTANTS.PRICE_LIMIT_PERCENT;
}

// API 相关常量
export const API_CONSTANTS = {
  // 默认分页大小
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // iTick API
  ITICK_API_ENDPOINT: process.env.ITICK_API_ENDPOINT || 'https://api.itick.org/v1',
  ITICK_BATCH_SIZE: 50,
} as const;

// UI 相关常量
export const UI_CONSTANTS = {
  // 响应式断点
  BREAKPOINTS: {
    MOBILE: 640,   // sm
    TABLET: 1024,  // lg
    DESKTOP: 1280, // xl
  },
  
  // 动画时长
  ANIMATION_DURATION: 300,
  
  // 刷新间隔（毫秒）
  REFRESH_INTERVAL: 30000, // 30秒
} as const;

// 功能开关
export const FEATURE_FLAGS = {
  ENABLE_ANALYSIS: process.env.NEXT_PUBLIC_ENABLE_ANALYSIS === 'true',
} as const;
