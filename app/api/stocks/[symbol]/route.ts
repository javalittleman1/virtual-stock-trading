import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ITICK_API_KEY = process.env.ITICK_API_KEY!;
const ITICK_BASE = 'https://api.itick.org/stock/quotes';

// GET /api/stocks/:symbol - 获取单只股票实时行情（优先读 DB，辅以 iTick 实时）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const supabase = await createClient();

    // 先从 Supabase 读取基础信息
    const { data: stock, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (error || !stock) {
      return NextResponse.json({ error: '股票不存在' }, { status: 404 });
    }

    // 实时从 iTick 获取最新价格（非交易时段直接返回 DB 数据）
    try {
      const region = stock.region?.toLowerCase() || (symbol.startsWith('6') || symbol.startsWith('688') ? 'sh' : 'sz');
      const url = `${ITICK_BASE}?region=${region}&codes=${symbol}`;
      const res = await fetch(url, {
        headers: { 'token': ITICK_API_KEY },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.code === 0 && json.data?.[symbol]) {
          const q = json.data[symbol];
          return NextResponse.json({
            ...stock,
            current_price: q.p,
            prev_close: q.ld,
            open: q.o,
            high: q.h,
            low: q.l,
            volume: q.v,
            change: q.ch,
            change_percent: q.chp,
          });
        }
      }
    } catch {
      // 实时获取失败，降级返回 DB 数据
    }

    // 降级：返回 DB 中的数据（计算涨跌幅）
    return NextResponse.json({
      ...stock,
      change: stock.current_price - stock.prev_close,
      change_percent: stock.prev_close > 0
        ? ((stock.current_price - stock.prev_close) / stock.prev_close) * 100
        : 0,
    });

  } catch (error) {
    console.error('Error in stock detail API:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
