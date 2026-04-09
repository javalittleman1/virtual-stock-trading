import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const ITICK_API_KEY = process.env.ITICK_API_KEY!;
const ITICK_BASE = 'https://api.itick.org/stock/quotes';

// 沪深 300 成分股 + 常见热门股票（含代码、名称、市场）
// region: sh=沪市, sz=深市
const SEED_STOCKS: Array<{ symbol: string; name: string; region: 'SH' | 'SZ' }> = [
  // 沪市主板
  { symbol: '600519', name: '贵州茅台', region: 'SH' },
  { symbol: '601318', name: '中国平安', region: 'SH' },
  { symbol: '600036', name: '招商银行', region: 'SH' },
  { symbol: '600276', name: '恒瑞医药', region: 'SH' },
  { symbol: '601166', name: '兴业银行', region: 'SH' },
  { symbol: '600900', name: '长江电力', region: 'SH' },
  { symbol: '601088', name: '中国神华', region: 'SH' },
  { symbol: '600028', name: '中国石化', region: 'SH' },
  { symbol: '601628', name: '中国人寿', region: 'SH' },
  { symbol: '601398', name: '工商银行', region: 'SH' },
  { symbol: '601288', name: '农业银行', region: 'SH' },
  { symbol: '601939', name: '建设银行', region: 'SH' },
  { symbol: '601328', name: '交通银行', region: 'SH' },
  { symbol: '600887', name: '伊利股份', region: 'SH' },
  { symbol: '600104', name: '上汽集团', region: 'SH' },
  { symbol: '600690', name: '海尔智家', region: 'SH' },
  { symbol: '601601', name: '中国太保', region: 'SH' },
  { symbol: '600030', name: '中信证券', region: 'SH' },
  { symbol: '601688', name: '华泰证券', region: 'SH' },
  { symbol: '600016', name: '民生银行', region: 'SH' },
  { symbol: '601229', name: '上海银行', region: 'SH' },
  { symbol: '600309', name: '万华化学', region: 'SH' },
  { symbol: '601012', name: '隆基绿能', region: 'SH' },
  { symbol: '600050', name: '中国联通', region: 'SH' },
  { symbol: '601857', name: '中国石油', region: 'SH' },
  // 深市主板
  { symbol: '000001', name: '平安银行', region: 'SZ' },
  { symbol: '000858', name: '五粮液', region: 'SZ' },
  { symbol: '000651', name: '格力电器', region: 'SZ' },
  { symbol: '000333', name: '美的集团', region: 'SZ' },
  { symbol: '002415', name: '海康威视', region: 'SZ' },
  { symbol: '000568', name: '泸州老窖', region: 'SZ' },
  { symbol: '002594', name: '比亚迪', region: 'SZ' },
  { symbol: '000002', name: '万科A', region: 'SZ' },
  { symbol: '002352', name: '顺丰控股', region: 'SZ' },
  { symbol: '002714', name: '牧原股份', region: 'SZ' },
  { symbol: '000100', name: 'TCL科技', region: 'SZ' },
  { symbol: '000725', name: '京东方A', region: 'SZ' },
  { symbol: '000776', name: '广发证券', region: 'SZ' },
  { symbol: '001979', name: '招商蛇口', region: 'SZ' },
  { symbol: '002027', name: '分众传媒', region: 'SZ' },
  // 深市创业板
  { symbol: '300750', name: '宁德时代', region: 'SZ' },
  { symbol: '300059', name: '东方财富', region: 'SZ' },
  { symbol: '300760', name: '迈瑞医疗', region: 'SZ' },
  { symbol: '300015', name: '爱尔眼科', region: 'SZ' },
  { symbol: '300122', name: '智飞生物', region: 'SZ' },
  { symbol: '300274', name: '阳光电源', region: 'SZ' },
  { symbol: '300124', name: '汇川技术', region: 'SZ' },
  { symbol: '300316', name: '晶盛机电', region: 'SZ' },
  { symbol: '300999', name: '金龙鱼', region: 'SZ' },
  { symbol: '300014', name: '亿纬锂能', region: 'SZ' },
  // 科创板
  { symbol: '688599', name: '天合光能', region: 'SH' },
  { symbol: '688036', name: '传音控股', region: 'SH' },
  { symbol: '688111', name: '金山办公', region: 'SH' },
  { symbol: '688981', name: '中芯国际', region: 'SH' },
  { symbol: '688041', name: '海光信息', region: 'SH' },
];

interface ITickQuote {
  s: string;
  ld: number;
  p: number;
  o: number;
  h: number;
  l: number;
  v: number;
  tu: number;
  ch: number;
  chp: number;
  r: string;
}

async function fetchQuotes(region: string, codes: string[]): Promise<ITickQuote[]> {
  const BATCH = 3; // iTick 免费版每次最多 3 只
  const results: ITickQuote[] = [];
  for (let i = 0; i < codes.length; i += BATCH) {
    const batch = codes.slice(i, i + BATCH);
    try {
      const url = `${ITICK_BASE}?region=${region}&codes=${batch.join(',')}`;
      const res = await fetch(url, {
        headers: { 'token': ITICK_API_KEY },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (json.code === 0 && json.data) {
        results.push(...(Object.values(json.data) as ITickQuote[]));
      }
      // 避免频率限制
      if (i + BATCH < codes.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    } catch { continue; }
  }
  return results;
}

// POST /api/admin/init-stocks - 初始化股票数据（拉取 iTick 实时行情写入 stocks 表）
// 仅需执行一次（或在数据库初始化后执行）
export async function POST() {
  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // 分组按市场
    const shStocks = SEED_STOCKS.filter(s => s.region === 'SH');
    const szStocks = SEED_STOCKS.filter(s => s.region === 'SZ');

    const shCodes = shStocks.map(s => s.symbol);
    const szCodes = szStocks.map(s => s.symbol);

    // 并行获取沪深行情
    const [shQuotes, szQuotes] = await Promise.all([
      shCodes.length > 0 ? fetchQuotes('sh', shCodes) : Promise.resolve([]),
      szCodes.length > 0 ? fetchQuotes('sz', szCodes) : Promise.resolve([]),
    ]);

    // 构建行情 map（symbol -> quote）
    const quoteMap = new Map<string, ITickQuote>();
    [...shQuotes, ...szQuotes].forEach(q => quoteMap.set(q.s, q));

    // 合并基础信息 + 行情数据（先不写 region/turnover，避免字段不存在报错）
    const upsertData = SEED_STOCKS.map(stock => {
      const q = quoteMap.get(stock.symbol);
      return {
        symbol: stock.symbol,
        name: stock.name,
        market: 'A',
        current_price: q?.p ?? 0,
        prev_close: q?.ld ?? 0,
        open: q?.o ?? 0,
        high: q?.h ?? 0,
        low: q?.l ?? 0,
        volume: q?.v ?? 0,
        updated_at: now,
      };
    });

    const { error } = await supabase
      .from('stocks')
      .upsert(upsertData, { onConflict: 'symbol' });

    if (error) {
      console.error('Error inserting stocks:', error);
      return NextResponse.json({ error: '写入失败: ' + error.message }, { status: 500 });
    }

    // 尝试更新 region/turnover（如果列存在）
    try {
      for (const stock of SEED_STOCKS) {
        const q = quoteMap.get(stock.symbol);
        await supabase
          .from('stocks')
          .update({ region: stock.region, turnover: q?.tu ?? 0 })
          .eq('symbol', stock.symbol);
      }
    } catch {
      // 如果 region/turnover 列不存在，忽略错误
    }

    const fetched = shQuotes.length + szQuotes.length;
    return NextResponse.json({
      success: true,
      total: SEED_STOCKS.length,
      fetched,
      message: `成功初始化 ${upsertData.length} 只股票，获取到 ${fetched} 条实时行情`,
    });

  } catch (error) {
    console.error('Error in init-stocks:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// GET /api/admin/init-stocks - 查询当前 stocks 表数量
export async function GET() {
  try {
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from('stocks')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count, message: `当前 stocks 表共有 ${count} 条记录` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
