-- ============================================================
-- 数据库迁移脚本：添加 region 和 turnover 字段到 stocks 表
-- 如果 stocks 表是全新的，请直接执行 schema.sql
-- 如果 stocks 表已存在，执行此迁移脚本
-- ============================================================

-- 为 stocks 表添加 region 字段（沪市/深市区分）
ALTER TABLE public.stocks 
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'SH' 
  CHECK (region IN ('SH', 'SZ'));

-- 为 stocks 表添加 turnover 字段（成交额）
ALTER TABLE public.stocks 
  ADD COLUMN IF NOT EXISTS turnover DECIMAL(20, 2) NOT NULL DEFAULT 0;

-- 更新已有股票的 region（根据股票代码规则推断）
-- 600xxx/601xxx/603xxx/605xxx/688xxx -> SH
-- 000xxx/001xxx/002xxx/003xxx/300xxx/301xxx -> SZ
UPDATE public.stocks SET region = 'SH' WHERE 
  symbol ~ '^6[0-9]{5}$';

UPDATE public.stocks SET region = 'SZ' WHERE 
  symbol ~ '^0[0-9]{5}$' OR symbol ~ '^3[0-9]{5}$';
