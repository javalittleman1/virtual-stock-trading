import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/watchlist/:symbol - 移除自选股
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const supabase = await createClient();
    const { symbol } = await params;
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('stock_symbol', symbol);
    
    if (error) {
      console.error('Error removing from watchlist:', error);
      return NextResponse.json(
        { error: '移除自选股失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      symbol,
      message: '移除成功' 
    });
  } catch (error) {
    console.error('Error in remove watchlist API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
