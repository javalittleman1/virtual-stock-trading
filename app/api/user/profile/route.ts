import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/user/profile - 获取当前用户资料（如果不存在则自动创建）
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
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // 如果 profile 不存在，自动创建（兼容没有运行触发器的情况）
    if (error?.code === 'PGRST116') {
      const serviceClient = createServiceClient();
      const { data: newProfile, error: createError } = await serviceClient
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          virtual_balance: 1000000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json(
          { error: '创建用户信息失败' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(newProfile);
    }
    
    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: '获取用户信息失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
