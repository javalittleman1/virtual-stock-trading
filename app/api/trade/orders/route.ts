import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/trade/orders - 获取委托记录
export async function GET(request: NextRequest) {
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
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    // 状态过滤
    if (status) {
      query = query.eq('status', status);
    }
    
    // 分页
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: '获取委托记录失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in orders API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
