import { TRADE_CONSTANTS, getPriceLimitPercent } from './constants';

/**
 * 获取中国时区(UTC+8)的时间信息
 */
function getChinaTime() {
  const now = new Date();
  // 将当前时间转为中国时区
  const chinaOffset = 8 * 60; // UTC+8
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const chinaDate = new Date(utcMs + chinaOffset * 60 * 1000);
  return {
    day: chinaDate.getDay(),
    hour: chinaDate.getHours(),
    minute: chinaDate.getMinutes(),
    time: chinaDate.getHours() * 100 + chinaDate.getMinutes(),
  };
}

/**
 * 检查当前是否在交易时间
 * A股交易时间：周一至周五 9:30-11:30, 13:00-15:00
 */
export function isTradingHour(): boolean {
  const { day, time } = getChinaTime();

  // 周末不交易
  if (day === 0 || day === 6) {
    return false;
  }

  // 上午 9:30-11:30 或 下午 13:00-15:00
  return (
    (time >= TRADE_CONSTANTS.MORNING_START && time <= TRADE_CONSTANTS.MORNING_END) ||
    (time >= TRADE_CONSTANTS.AFTERNOON_START && time <= TRADE_CONSTANTS.AFTERNOON_END)
  );
}

/**
 * 获取下一个交易时间提示
 */
export function getNextTradingTime(): string {
  const { day, time } = getChinaTime();

  // 周末
  if (day === 0) return '下一个交易日：周一 9:30';
  if (day === 6) return '下一个交易日：周一 9:30';

  // 上午开盘前
  if (time < TRADE_CONSTANTS.MORNING_START) {
    return '今日开盘：9:30';
  }

  // 午休时间
  if (time > TRADE_CONSTANTS.MORNING_END && time < TRADE_CONSTANTS.AFTERNOON_START) {
    return '下午开盘：13:00';
  }

  // 下午收盘后
  if (time > TRADE_CONSTANTS.AFTERNOON_END) {
    if (day === 5) return '下一个交易日：周一 9:30';
    return '下一个交易日：明天 9:30';
  }

  return '交易中';
}

/**
 * 计算涨停价
 */
export function getUpperLimitPrice(prevClose: number, symbol: string): number {
  const limitPercent = getPriceLimitPercent(symbol);
  return Math.round(prevClose * (1 + limitPercent) * 100) / 100;
}

/**
 * 计算跌停价
 */
export function getLowerLimitPrice(prevClose: number, symbol: string): number {
  const limitPercent = getPriceLimitPercent(symbol);
  return Math.round(prevClose * (1 - limitPercent) * 100) / 100;
}

/**
 * 检查价格是否在涨跌停范围内
 */
export function isPriceWithinLimit(
  price: number,
  prevClose: number,
  symbol: string
): boolean {
  const upperLimit = getUpperLimitPrice(prevClose, symbol);
  const lowerLimit = getLowerLimitPrice(prevClose, symbol);
  return price >= lowerLimit && price <= upperLimit;
}

/**
 * 计算交易手续费
 * @param amount 交易金额
 * @param type 交易类型：'buy' | 'sell'
 */
export function calculateFee(amount: number, type: 'buy' | 'sell'): number {
  // 佣金（买卖双向收取）
  let fee = Math.max(
    amount * TRADE_CONSTANTS.FEE_RATE,
    TRADE_CONSTANTS.MIN_FEE
  );

  // 印花税（卖出时单边收取）
  if (type === 'sell') {
    fee += amount * TRADE_CONSTANTS.STAMP_TAX_RATE;
  }

  return Math.round(fee * 100) / 100;
}

/**
 * 计算交易总成本（包含手续费）
 */
export function calculateTotalCost(
  price: number,
  quantity: number,
  type: 'buy' | 'sell'
): { amount: number; fee: number; total: number } {
  const amount = price * quantity;
  const fee = calculateFee(amount, type);
  const total = type === 'buy' ? amount + fee : amount - fee;

  return {
    amount: Math.round(amount * 100) / 100,
    fee: Math.round(fee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * 验证交易数量是否合法（必须是100的整数倍）
 */
export function isValidQuantity(quantity: number): boolean {
  return (
    quantity > 0 &&
    quantity % TRADE_CONSTANTS.MIN_TRADE_QUANTITY === 0
  );
}

/**
 * 格式化数量（转换为"手"，1手=100股）
 */
export function formatQuantity(quantity: number): string {
  const hands = quantity / TRADE_CONSTANTS.MIN_TRADE_QUANTITY;
  return `${hands}手`;
}

/**
 * 检查是否是T+1交易（当日买入不能卖出）
 * 注意：实际实现需要在数据库中记录买入时间
 * 这里仅提供接口
 */
export function canSellToday(
  buyDate: Date,
  sellDate: Date = new Date()
): boolean {
  // 将日期转换为本地日期字符串进行比较
  const buyDateStr = buyDate.toDateString();
  const sellDateStr = sellDate.toDateString();

  // 不同日期可以卖出
  return buyDateStr !== sellDateStr;
}

/**
 * 验证买入订单
 */
export interface BuyOrderValidation {
  valid: boolean;
  error?: string;
}

export function validateBuyOrder(
  symbol: string,
  price: number,
  quantity: number,
  availableBalance: number,
  prevClose: number
): BuyOrderValidation {
  // 检查交易时间
  if (!isTradingHour()) {
    return { valid: false, error: '非交易时间，无法下单' };
  }

  // 检查数量
  if (!isValidQuantity(quantity)) {
    return { valid: false, error: `交易数量必须是${TRADE_CONSTANTS.MIN_TRADE_QUANTITY}股的整数倍` };
  }

  // 检查价格是否在涨跌停范围内
  if (!isPriceWithinLimit(price, prevClose, symbol)) {
    const upperLimit = getUpperLimitPrice(prevClose, symbol);
    const lowerLimit = getLowerLimitPrice(prevClose, symbol);
    return { valid: false, error: `委托价格必须在 ${lowerLimit.toFixed(2)} - ${upperLimit.toFixed(2)} 元之间` };
  }

  // 检查资金是否充足
  const { total } = calculateTotalCost(price, quantity, 'buy');
  if (total > availableBalance) {
    return { valid: false, error: '可用资金不足' };
  }

  return { valid: true };
}

/**
 * 验证卖出订单
 */
export interface SellOrderValidation {
  valid: boolean;
  error?: string;
}

export function validateSellOrder(
  symbol: string,
  price: number,
  quantity: number,
  availableQuantity: number,
  prevClose: number,
  buyDate?: Date
): SellOrderValidation {
  // 检查交易时间
  if (!isTradingHour()) {
    return { valid: false, error: '非交易时间，无法下单' };
  }

  // 检查T+1规则
  if (buyDate && !canSellToday(buyDate)) {
    return { valid: false, error: 'A股实行T+1交易，当日买入的股票次日才能卖出' };
  }

  // 检查数量
  if (!isValidQuantity(quantity)) {
    return { valid: false, error: `交易数量必须是${TRADE_CONSTANTS.MIN_TRADE_QUANTITY}股的整数倍` };
  }

  // 检查持仓是否足够
  if (quantity > availableQuantity) {
    return { valid: false, error: '持仓数量不足' };
  }

  // 检查价格是否在涨跌停范围内
  if (!isPriceWithinLimit(price, prevClose, symbol)) {
    const upperLimit = getUpperLimitPrice(prevClose, symbol);
    const lowerLimit = getLowerLimitPrice(prevClose, symbol);
    return { valid: false, error: `委托价格必须在 ${lowerLimit.toFixed(2)} - ${upperLimit.toFixed(2)} 元之间` };
  }

  return { valid: true };
}

/**
 * 计算持仓盈亏
 */
export function calculateProfitLoss(
  currentPrice: number,
  avgCost: number,
  quantity: number
): { profitLoss: number; profitLossPercent: number } {
  const profitLoss = (currentPrice - avgCost) * quantity;
  const profitLossPercent = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;

  return {
    profitLoss: Math.round(profitLoss * 100) / 100,
    profitLossPercent: Math.round(profitLossPercent * 100) / 100,
  };
}

/**
 * 计算市值
 */
export function calculateMarketValue(price: number, quantity: number): number {
  return Math.round(price * quantity * 100) / 100;
}
