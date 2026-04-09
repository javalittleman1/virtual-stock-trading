import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isTradingHour } from '@/lib/trading-rules';

const ITICK_API_KEY = process.env.ITICK_API_KEY!;
const ITICK_BASE = 'https://api.itick.org/stock/quotes';

// iTick 真实响应字段映射
interface ITickQuote {
  s: string;   // 股票代码
  ld: number;  // 昨收价
  p: number;   // 当前价
  o: number;   // 开盘价
  h: number;   // 最高价
  l: number;   // 最低价
  v: number;   // 成交量（手）
  tu: number;  // 成交额
  ch: number;  // 涨跌额
  chp: number; // 涨跌幅%
  r: string;   // 市场（SH/SZ）
}

async function fetchITickBatch(region: string, codes: string[]): Promise<ITickQuote[]> {
  const url = `${ITICK_BASE}?region=${region}&codes=${codes.join(',')}`;
  const res = await fetch(url, {
    headers: { 'token': ITICK_API_KEY },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`iTick API error: ${res.status} - ${errText.slice(0, 200)}`);
  }
  const json = await res.json();
  if (json.code !== 0 || !json.data) {
    console.error('iTick non-zero code:', json);
    return [];
  }
  return Object.values(json.data) as ITickQuote[];
}

/**
 * GET /api/cron/update-prices
 * 
 * 支持参数：
 * - force=1        跳过交易时间检查
 * - offset=N       从第 N 只股票开始（默认 0）
 * - limit=N        每次更新 N 只（默认 3，最多 3，受 iTick 免费版限制）
 * 
 * 设计原则：每次只更新一批（3只），由 Dashboard 定时按轮换方式更新全部股票。
 * 避免一次性请求 55 只触发 429 或超时。
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Cron Secret（如果配置了）
    const cronSecret = request.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查是否在交易时间（非交易时段允许通过 force=1 跳过检查）
    const force = request.nextUrl.searchParams.get('force') === '1';
    if (!force && !isTradingHour()) {
      return NextResponse.json({ message: '非交易时段，跳过更新', isTradingHour: false });
    }

    // 分页参数：每次只更新一批 3 只
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '3'), 3);

    const supabase = createServiceClient();

    // 获取需要更新的股票（按 updated_at 升序，优先更新最旧的）
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('symbol')
      .order('updated_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (stocksError) {
      return NextResponse.json({ error: '获取股票列表失败: ' + stocksError.message }, { status: 500 });
    }

    if (!stocks || stocks.length === 0) {
      return NextResponse.json({ message: '没有需要更新的股票', updated: 0 });
    }

    // 按市场分组
    const shSymbols: string[] = [];
    const szSymbols: string[] = [];
    for (const s of stocks) {
      if ((s.symbol as string).startsWith('6')) {
        shSymbols.push(s.symbol as string);
      } else {
        szSymbols.push(s.symbol as string);
      }
    }

    const now = new Date().toISOString();
    let updatedCount = 0;
    let errorCount = 0;

    // 串行请求沪市和深市（避免并发触发限速）
    const allQuotes: ITickQuote[] = [];

    if (shSymbols.length > 0) {
      try {
        const quotes = await fetchITickBatch('sh', shSymbols);
        allQuotes.push(...quotes);
      } catch (e) {
        console.error('SH batch error:', e);
        errorCount += shSymbols.length;
      }
    }

    if (szSymbols.length > 0) {
      // 如果沪市和深市都有，两次请求间加短暂延迟
      if (shSymbols.length > 0) {
        await new Promise(r => setTimeout(r, 2000));
      }
      try {
        const quotes = await fetchITickBatch('sz', szSymbols);
        allQuotes.push(...quotes);
      } catch (e) {
        console.error('SZ batch error:', e);
        errorCount += szSymbols.length;
      }
    }

    if (allQuotes.length > 0) {
      const now2 = now;
      // 分别更新每只股票的行情字段（不覆盖 name 等基础字段）
      const updateResults = await Promise.all(
        allQuotes.map(async (q) => {
          const { error } = await supabase
            .from('stocks')
            .update({
              current_price: q.p ?? 0,
              prev_close: q.ld ?? 0,
              open: q.o ?? 0,
              high: q.h ?? 0,
              low: q.l ?? 0,
              volume: q.v ?? 0,
              updated_at: now2,
            })
            .eq('symbol', q.s);
          return error ? (0 as number) : (1 as number);
        })
      );
      updatedCount = updateResults.reduce((sum, v) => sum + v, 0);
      errorCount += updateResults.filter(v => v === 0).length;
    }

    // 获取总数，用于前端轮换计算
    const { count: totalCount } = await supabase
      .from('stocks')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      errors: errorCount,
      offset,
      limit,
      total: totalCount || 0,
      nextOffset: offset + limit < (totalCount || 0) ? offset + limit : 0,
      isTradingHour: isTradingHour(),
      timestamp: now,
    });

  } catch (error) {
    console.error('Error in update-prices API:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
