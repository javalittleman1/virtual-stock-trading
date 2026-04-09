import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/stocks/:symbol - 获取单只股票详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const supabase = await createClient();
    const { symbol } = await params;
    
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '股票不存在' },
          { status: 404 }
        );
      }
      console.error('Error fetching stock:', error);
      return NextResponse.json(
        { error: '获取股票信息失败' },
        { status: 500 }
      );
    }
    
    // 计算涨跌幅
    const stockWithChange = {
      ...data,
      change: data.current_price - data.prev_close,
      change_percent: data.prev_close > 0 
        ? ((data.current_price - data.prev_close) / data.prev_close) * 100 
        : 0,
    };
    
    return NextResponse.json(stockWithChange);
  } catch (error) {
    console.error('Error in stock detail API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
