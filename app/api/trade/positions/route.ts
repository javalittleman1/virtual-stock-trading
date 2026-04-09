import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/trade/positions - 获取当前持仓
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
      .from('portfolios')
      .select(`
        *,
        stock:stocks(*)
      `)
      .eq('user_id', user.id)
      .gt('quantity', 0)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching positions:', error);
      return NextResponse.json(
        { error: '获取持仓失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in positions API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
