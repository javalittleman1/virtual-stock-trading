import { createClient } from '@supabase/supabase-js';

/**
 * 服务端 Supabase 客户端（使用 service_role key，绕过 RLS）
 * 仅在服务端 API 路由中使用，不要暴露给客户端
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
