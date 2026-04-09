-- ============================================================
-- 修复 service_role RLS 策略
-- 将 auth.role() 替换为 (SELECT auth.role()) 以兼容 Supabase 新版
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;
CREATE POLICY "profiles_service_all" ON public.profiles 
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- stocks
DROP POLICY IF EXISTS "stocks_service_write" ON public.stocks;
CREATE POLICY "stocks_service_write" ON public.stocks 
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- portfolios
DROP POLICY IF EXISTS "portfolios_service_all" ON public.portfolios;
CREATE POLICY "portfolios_service_all" ON public.portfolios 
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- orders
DROP POLICY IF EXISTS "orders_service_all" ON public.orders;
CREATE POLICY "orders_service_all" ON public.orders 
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- transactions
DROP POLICY IF EXISTS "transactions_service_all" ON public.transactions;
CREATE POLICY "transactions_service_all" ON public.transactions 
  FOR ALL USING ((SELECT auth.role()) = 'service_role');
