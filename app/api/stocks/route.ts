import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { API_CONSTANTS } from '@/lib/constants';

// GET /api/stocks - 获取股票列表
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(API_CONSTANTS.DEFAULT_PAGE_SIZE)),
      API_CONSTANTS.MAX_PAGE_SIZE
    );
    
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = supabase
      .from('stocks')
      .select('*', { count: 'exact' });
    
    // 搜索过滤
    if (keyword) {
      query = query.or(`symbol.ilike.%${keyword}%,name.ilike.%${keyword}%`);
    }
    
    // 分页
    query = query
      .order('volume', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching stocks:', error);
      return NextResponse.json(
        { error: '获取股票列表失败' },
        { status: 500 }
      );
    }
    
    // 计算涨跌幅
    const stocksWithChange = data?.map(stock => ({
      ...stock,
      change: stock.current_price - stock.prev_close,
      change_percent: stock.prev_close > 0 
        ? ((stock.current_price - stock.prev_close) / stock.prev_close) * 100 
        : 0,
    })) || [];
    
    return NextResponse.json({
      data: stocksWithChange,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in stocks API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
