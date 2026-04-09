-- ============================================================
-- 模拟炒股应用数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- 1. profiles 表（用户资料与虚拟资金）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  virtual_balance DECIMAL(15, 2) NOT NULL DEFAULT 1000000.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, virtual_balance)
  VALUES (NEW.id, NEW.email, 1000000.00)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. stocks 表（股票行情数据）
CREATE TABLE IF NOT EXISTS public.stocks (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  market TEXT NOT NULL DEFAULT 'A' CHECK (market IN ('A', 'HK', 'US')),
  region TEXT NOT NULL DEFAULT 'SH' CHECK (region IN ('SH', 'SZ')),
  current_price DECIMAL(10, 3) NOT NULL DEFAULT 0,
  prev_close DECIMAL(10, 3) NOT NULL DEFAULT 0,
  open DECIMAL(10, 3) NOT NULL DEFAULT 0,
  high DECIMAL(10, 3) NOT NULL DEFAULT 0,
  low DECIMAL(10, 3) NOT NULL DEFAULT 0,
  volume BIGINT NOT NULL DEFAULT 0,
  turnover DECIMAL(20, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stocks_symbol_idx ON public.stocks(symbol);
CREATE INDEX IF NOT EXISTS stocks_updated_at_idx ON public.stocks(updated_at DESC);

-- 3. watchlist 表（自选股）
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, stock_symbol)
);

CREATE INDEX IF NOT EXISTS watchlist_user_id_idx ON public.watchlist(user_id);

-- 4. portfolios 表（持仓）
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  avg_cost DECIMAL(10, 3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, stock_symbol)
);

CREATE INDEX IF NOT EXISTS portfolios_user_id_idx ON public.portfolios(user_id);

-- 5. orders 表（委托订单）
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  price DECIMAL(10, 3) NOT NULL,
  quantity INTEGER NOT NULL,
  filled_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partial', 'cancelled')),
  fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);

-- 6. transactions 表（成交记录）
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 3) NOT NULL,
  fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'filled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at DESC);

-- ============================================================
-- Row Level Security（RLS）策略
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- stocks 表所有人可读（公开行情）
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stocks_public_read" ON public.stocks FOR SELECT USING (true);
CREATE POLICY "stocks_service_write" ON public.stocks FOR ALL USING (auth.role() = 'service_role');

-- profiles：只能读写自己的
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_service_all" ON public.profiles FOR ALL USING (auth.role() = 'service_role');

-- watchlist：只能操作自己的
CREATE POLICY "watchlist_self" ON public.watchlist USING (auth.uid() = user_id);
CREATE POLICY "watchlist_insert" ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

-- portfolios：只能操作自己的
CREATE POLICY "portfolios_self" ON public.portfolios USING (auth.uid() = user_id);
CREATE POLICY "portfolios_service_all" ON public.portfolios FOR ALL USING (auth.role() = 'service_role');

-- orders：只能操作自己的
CREATE POLICY "orders_self" ON public.orders USING (auth.uid() = user_id);
CREATE POLICY "orders_service_all" ON public.orders FOR ALL USING (auth.role() = 'service_role');

-- transactions：只能读自己的
CREATE POLICY "transactions_self_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_service_all" ON public.transactions FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Realtime 开启
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.stocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
