import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/watchlist - 获取自选股列表
export async function GET() {
  try {
    const supabase = await createClient();
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    const { data, error } = await supabase
      .from('watchlist')
      .select(`
        *,
        stock:stocks(*)
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching watchlist:', error);
      return NextResponse.json(
        { error: '获取自选股失败' },
        { status: 500 }
      );
    }
    
    // 处理数据，添加涨跌幅
    const watchlistWithChange = data?.map((item: { stock: { current_price: number; prev_close: number;[key: string]: unknown };[key: string]: unknown }) => ({
      ...item,
      stock: item.stock ? {
        ...item.stock,
        change: item.stock.current_price - item.stock.prev_close,
        change_percent: item.stock.prev_close > 0 
          ? ((item.stock.current_price - item.stock.prev_close) / item.stock.prev_close) * 100 
          : 0,
      } : null,
    })) || [];
    
    return NextResponse.json({ data: watchlistWithChange });
  } catch (error) {
    console.error('Error in watchlist API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// POST /api/watchlist - 添加自选股
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { symbol } = body;
    
    if (!symbol) {
      return NextResponse.json(
        { error: '股票代码不能为空' },
        { status: 400 }
      );
    }
    
    // 检查股票是否存在
    const { data: stockData, error: stockError } = await supabase
      .from('stocks')
      .select('symbol')
      .eq('symbol', symbol)
      .single();
    
    if (stockError || !stockData) {
      return NextResponse.json(
        { error: '股票不存在' },
        { status: 404 }
      );
    }
    
    // 添加到自选股（使用 service client 绕过 RLS upsert 限制）
    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('watchlist')
      .upsert({
        user_id: user.id,
        stock_symbol: symbol,
        added_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,stock_symbol',
        ignoreDuplicates: true,
      });
    
    if (error) {
      console.error('Error adding to watchlist:', error);
      return NextResponse.json(
        { error: '添加自选股失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      symbol,
      message: '添加成功' 
    });
  } catch (error) {
    console.error('Error in add watchlist API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
