# 股掌 - 模拟炒股应用

<p align="center">
  <strong>仿真交易 · 智能复盘</strong>
</p>

<p align="center">
  基于 Next.js + Supabase 构建的全栈模拟炒股应用，接入真实 A 股行情数据
</p>

---

## 功能特性

### 📊 行情模块
- 接入 iTick API 获取真实 A 股实时行情
- 股票搜索与筛选
- 分页轮换更新价格，避免 API 限速
- 涨跌幅、成交量等实时展示

### 💰 交易模块
- 买入/卖出委托下单
- 交易时间校验（A 股交易时段：9:30-11:30, 13:00-15:00）
- 涨跌停价格限制
- 手续费自动计算（万 0.025%）
- T+1 交易规则校验

### 📈 持仓管理
- 实时持仓列表
- 盈亏计算与展示
- 持仓市值统计

### ⭐ 自选股
- 添加/移除自选股
- 自选股行情实时更新

### 📉 分析模块
- 交易次数统计
- 胜率计算
- 总收益率展示

### 💵 资产模块
- 总资产概览
- 可用余额
- 持仓市值
- 累计收益

---

## 技术栈

| 技术 | 说明 |
|------|------|
| [Next.js 16](https://nextjs.org/) | React 全栈框架，App Router |
| [Supabase](https://supabase.com/) | 后端即服务（数据库、认证、实时订阅） |
| [Zustand](https://github.com/pmndrs/zustand) | 轻量级状态管理 |
| [shadcn/ui](https://ui.shadcn.com/) | React UI 组件库 |
| [Tailwind CSS](https://tailwindcss.com/) | 原子化 CSS 框架 |
| [Vercel](https://vercel.com/) | 部署平台 |
| [iTick API](https://itick.io/) | 股票行情数据源 |

---

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # 仪表板页面（需登录）
│   │   ├── analysis/       # 分析页
│   │   ├── portfolio/      # 资产页
│   │   ├── stocks/         # 行情页
│   │   ├── trade/          # 交易页
│   │   └── watchlist/      # 自选股页
│   ├── api/                # API 路由
│   │   ├── stocks/         # 股票行情 API
│   │   ├── trade/          # 交易相关 API
│   │   ├── user/           # 用户相关 API
│   │   └── watchlist/      # 自选股 API
│   └── auth/               # 认证页面
├── components/             # React 组件
│   ├── layout/             # 布局组件
│   ├── portfolio/          # 持仓相关组件
│   ├── stocks/             # 股票相关组件
│   ├── trade/              # 交易相关组件
│   └── ui/                 # shadcn/ui 基础组件
├── lib/                    # 工具函数
│   ├── supabase/           # Supabase 客户端配置
│   ├── trading-rules.ts    # 交易规则引擎
│   └── constants.ts        # 常量定义
├── stores/                 # Zustand 状态管理
│   ├── useAuthStore.ts     # 认证状态
│   ├── useStockStore.ts    # 股票数据状态
│   ├── useTradeStore.ts    # 交易状态
│   └── useUserStore.ts     # 用户数据状态
├── types/                  # TypeScript 类型定义
└── supabase/               # 数据库 schema 和迁移脚本
```

---

## 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）或 npm

### 1. 克隆项目

```bash
git clone https://github.com/your-username/virtual-stock-trading.git
cd virtual-stock-trading
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# iTick API（股票行情数据）
ITICK_API_KEY=your_itick_api_key
```

> 在 [Supabase Dashboard](https://supabase.com/dashboard) 的 Project Settings > API 中获取相关密钥

### 4. 初始化数据库

在 Supabase SQL Editor 中执行 `supabase/schema.sql`

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/virtual-stock-trading)

部署时需要配置以下环境变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ITICK_API_KEY`

---

## 数据库设计

| 表名 | 说明 |
|------|------|
| `profiles` | 用户资料，含虚拟资金余额 |
| `stocks` | 股票行情数据缓存 |
| `portfolios` | 用户持仓 |
| `orders` | 委托订单 |
| `transactions` | 成交记录 |
| `watchlist` | 自选股 |

所有表均启用 RLS（Row Level Security），确保用户只能访问自己的数据。

---

## API 概览

| API | 方法 | 说明 |
|-----|------|------|
| `/api/stocks` | GET | 获取股票列表 |
| `/api/stocks/[symbol]` | GET | 获取单只股票详情 |
| `/api/trade/order` | POST | 提交委托订单 |
| `/api/trade/orders` | GET | 获取委托记录 |
| `/api/trade/positions` | GET | 获取持仓列表 |
| `/api/user/profile` | GET | 获取用户资料 |
| `/api/user/stats` | GET | 获取交易统计 |
| `/api/watchlist` | GET/POST | 自选股管理 |

---

## 开发命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 启动生产服务
pnpm start

# 代码检查
pnpm lint
```

---

## License

MIT
