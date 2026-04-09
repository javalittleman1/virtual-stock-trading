# 委托查询API

<cite>
**本文档引用的文件**
- [app/api/trade/orders/route.ts](file://app/api/trade/orders/route.ts)
- [types/index.ts](file://types/index.ts)
- [lib/constants.ts](file://lib/constants.ts)
- [lib/trading-rules.ts](file://lib/trading-rules.ts)
- [stores/useTradeStore.ts](file://stores/useTradeStore.ts)
- [components/trade/TradeHistory.tsx](file://components/trade/TradeHistory.tsx)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [supabase/schema.sql](file://supabase/schema.sql)
- [docs/API接口规范.md](file://docs/API接口规范.md)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介

委托查询API是虚拟股票交易系统的核心功能之一，负责为用户提供委托记录的查询、筛选和分页展示能力。该API基于Next.js Serverless Functions构建，采用Supabase作为数据库后端，实现了完整的委托查询功能，包括状态筛选、分页查询、实时订阅等功能。

## 项目结构

委托查询API位于应用的API路由层，采用模块化的文件组织方式：

```mermaid
graph TB
subgraph "API层"
OrdersRoute[app/api/trade/orders/route.ts]
OrderRoute[app/api/trade/order/route.ts]
end
subgraph "存储层"
TradeStore[stores/useTradeStore.ts]
UIStore[stores/useUIStore.ts]
end
subgraph "类型定义"
Types[index.ts]
Constants[lib/constants.ts]
end
subgraph "数据库层"
Schema[supabase/schema.sql]
OrdersTable[orders表]
TransactionsTable[transactions表]
end
OrdersRoute --> Schema
TradeStore --> OrdersRoute
TradeStore --> Types
OrdersRoute --> Types
OrdersRoute --> Constants
```

**图表来源**
- [app/api/trade/orders/route.ts:1-66](file://app/api/trade/orders/route.ts#L1-L66)
- [stores/useTradeStore.ts:1-192](file://stores/useTradeStore.ts#L1-L192)
- [supabase/schema.sql:75-91](file://supabase/schema.sql#L75-L91)

**章节来源**
- [app/api/trade/orders/route.ts:1-66](file://app/api/trade/orders/route.ts#L1-L66)
- [stores/useTradeStore.ts:1-192](file://stores/useTradeStore.ts#L1-L192)

## 核心组件

### API路由实现

委托查询API的核心实现位于`app/api/trade/orders/route.ts`文件中，提供了完整的GET /api/trade/orders接口：

- **认证机制**：使用Supabase Auth验证用户身份
- **查询参数处理**：支持status、page、limit参数
- **分页逻辑**：基于offset和range实现高效分页
- **状态筛选**：支持多种委托状态的过滤查询

### 数据模型定义

委托记录的数据结构在`types/index.ts`中明确定义：

```mermaid
classDiagram
class Order {
+string order_id
+string symbol
+string name
+string type
+number price
+number quantity
+number filled_quantity
+string status
+number fee
+string created_at
}
class ApiResponse {
+any data
+string error
+string message
+number total
+number page
+number limit
}
Order --> ApiResponse : "返回"
```

**图表来源**
- [types/index.ts:68-80](file://types/index.ts#L68-L80)
- [types/index.ts:148-156](file://types/index.ts#L148-L156)

**章节来源**
- [types/index.ts:68-80](file://types/index.ts#L68-L80)
- [types/index.ts:148-156](file://types/index.ts#L148-L156)

## 架构概览

委托查询API采用分层架构设计，确保了良好的可维护性和扩展性：

```mermaid
sequenceDiagram
participant Client as 客户端
participant API as 委托查询API
participant Auth as Supabase Auth
participant DB as Supabase数据库
participant Store as 应用状态管理
Client->>API : GET /api/trade/orders?status=&page=&limit=
API->>Auth : getUser()
Auth-->>API : 用户信息
API->>DB : 查询orders表
DB-->>API : 委托记录数据
API->>API : 分页处理
API-->>Client : JSON响应
Note over Client,Store : 应用前端通过store订阅实时更新
```

**图表来源**
- [app/api/trade/orders/route.ts:5-65](file://app/api/trade/orders/route.ts#L5-L65)
- [stores/useTradeStore.ts:68-84](file://stores/useTradeStore.ts#L68-L84)

## 详细组件分析

### API接口实现

#### 请求处理流程

```mermaid
flowchart TD
Start([请求进入]) --> AuthCheck[验证用户身份]
AuthCheck --> StatusCheck{用户存在?}
StatusCheck --> |否| AuthError[返回401错误]
StatusCheck --> |是| ParseParams[解析查询参数]
ParseParams --> BuildQuery[构建查询语句]
BuildQuery --> ApplyFilters[应用过滤条件]
ApplyFilters --> AddPagination[添加分页]
AddPagination --> ExecuteQuery[执行数据库查询]
ExecuteQuery --> HandleResult{查询成功?}
HandleResult --> |否| DBError[返回500错误]
HandleResult --> |是| FormatResponse[格式化响应]
FormatResponse --> ReturnSuccess[返回200成功]
AuthError --> End([结束])
DBError --> End
ReturnSuccess --> End
```

**图表来源**
- [app/api/trade/orders/route.ts:5-65](file://app/api/trade/orders/route.ts#L5-L65)

#### 查询参数详解

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| status | string | 否 | 无 | 委托状态过滤：pending、filled、partial、cancelled |
| page | number | 否 | 1 | 页码，从1开始 |
| limit | number | 否 | 20 | 每页记录数，最大100 |

#### 委托状态定义

根据数据库schema和业务逻辑，委托状态具有以下含义：

```mermaid
stateDiagram-v2
[*] --> pending : 创建委托
pending --> filled : 全部成交
pending --> partial : 部分成交
pending --> cancelled : 撤销委托
partial --> filled : 剩余成交
partial --> cancelled : 撤销剩余
filled --> [*] : 完成
cancelled --> [*] : 终止
```

**图表来源**
- [supabase/schema.sql:84](file://supabase/schema.sql#L84)

**章节来源**
- [app/api/trade/orders/route.ts:19-42](file://app/api/trade/orders/route.ts#L19-L42)
- [supabase/schema.sql:84](file://supabase/schema.sql#L84)

### 数据库设计

#### orders表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 委托记录唯一标识 |
| user_id | UUID | NOT NULL | 关联用户ID |
| stock_symbol | TEXT | NOT NULL | 股票代码 |
| type | TEXT | CHECK(type IN ('buy','sell')) | 交易类型 |
| price | DECIMAL(10,3) | NOT NULL | 委托价格 |
| quantity | INTEGER | NOT NULL | 委托数量 |
| filled_quantity | INTEGER | DEFAULT 0 | 已成交数量 |
| status | TEXT | CHECK(status IN ('pending','filled','partial','cancelled')) | 委托状态 |
| fee | DECIMAL(10,2) | DEFAULT 0 | 手续费 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

#### 索引设计

```mermaid
graph LR
OrdersTable[orders表] --> UserIndex[user_id索引]
OrdersTable --> CreatedAtIndex[created_at索引]
UserIndex --> Query1[按用户查询]
CreatedAtIndex --> Query2[按时间排序]
CreatedAtIndex --> Query3[分页查询]
```

**图表来源**
- [supabase/schema.sql:89](file://supabase/schema.sql#L89)
- [supabase/schema.sql:90](file://supabase/schema.sql#L90)

**章节来源**
- [supabase/schema.sql:75-91](file://supabase/schema.sql#L75-L91)

### 前端集成

#### 状态管理集成

应用使用Zustand状态管理库来管理委托数据：

```mermaid
sequenceDiagram
participant UI as TradeHistory组件
participant Store as useTradeStore
participant API as 委托查询API
participant Supabase as Supabase实时订阅
UI->>Store : fetchOrders(status?)
Store->>API : GET /api/trade/orders?status=
API-->>Store : 委托数据
Store->>Store : 更新状态
Store->>Supabase : 订阅orders表变化
Supabase-->>Store : 实时更新
Store->>UI : 状态变更通知
```

**图表来源**
- [stores/useTradeStore.ts:68-84](file://stores/useTradeStore.ts#L68-L84)
- [components/trade/TradeHistory.tsx:16-24](file://components/trade/TradeHistory.tsx#L16-L24)

**章节来源**
- [stores/useTradeStore.ts:68-84](file://stores/useTradeStore.ts#L68-L84)
- [components/trade/TradeHistory.tsx:16-24](file://components/trade/TradeHistory.tsx#L16-L24)

## 依赖关系分析

### 外部依赖

```mermaid
graph TB
OrdersAPI[委托查询API] --> Supabase[Supabase客户端]
OrdersAPI --> TradingRules[交易规则]
OrdersAPI --> Constants[常量配置]
Supabase --> Auth[Supabase Auth]
Supabase --> Database[PostgreSQL数据库]
TradingRules --> PriceCalculation[价格计算]
TradingRules --> QuantityValidation[数量验证]
Constants --> FeeRate[手续费率]
Constants --> MinQuantity[最小交易单位]
```

**图表来源**
- [app/api/trade/orders/route.ts:1-3](file://app/api/trade/orders/route.ts#L1-L3)
- [lib/trading-rules.ts:1-2](file://lib/trading-rules.ts#L1-L2)
- [lib/constants.ts:1-27](file://lib/constants.ts#L1-L27)

### 内部依赖

```mermaid
graph TD
OrdersAPI[委托查询API] --> Types[类型定义]
OrdersAPI --> ServerClient[服务端客户端]
TradeStore[交易状态管理] --> OrdersAPI
TradeStore --> Types
TradeHistory[交易历史组件] --> TradeStore
ServerClient --> SupabaseAuth[Supabase认证]
ServerClient --> SupabaseDB[Supabase数据库]
```

**图表来源**
- [stores/useTradeStore.ts:1-5](file://stores/useTradeStore.ts#L1-L5)
- [lib/supabase/server.ts:1-35](file://lib/supabase/server.ts#L1-L35)

**章节来源**
- [app/api/trade/orders/route.ts:1-3](file://app/api/trade/orders/route.ts#L1-L3)
- [stores/useTradeStore.ts:1-5](file://stores/useTradeStore.ts#L1-L5)

## 性能考虑

### 查询优化策略

1. **索引优化**
   - `user_id`索引：支持按用户快速查询
   - `created_at`索引：支持时间排序和分页查询

2. **分页优化**
   - 使用`range()`方法替代`offset`避免深度偏移
   - 限制最大分页大小防止资源消耗过大

3. **查询优化**
   - 只选择必要字段，避免`SELECT *`
   - 使用精确匹配过滤条件

### 缓存策略

```mermaid
flowchart LR
Request[API请求] --> CacheCheck{缓存命中?}
CacheCheck --> |是| ReturnCache[返回缓存数据]
CacheCheck --> |否| DBQuery[数据库查询]
DBQuery --> CacheUpdate[更新缓存]
CacheUpdate --> ReturnDB[返回数据库数据]
ReturnCache --> End([结束])
ReturnDB --> End
```

### 监控指标

- 查询响应时间
- 数据库连接数
- 缓存命中率
- 错误率统计

## 故障排除指南

### 常见错误及解决方案

| 错误类型 | 错误码 | 可能原因 | 解决方案 |
|----------|--------|----------|----------|
| 认证失败 | 401 | 用户未登录或会话过期 | 检查JWT令牌有效性 |
| 参数错误 | 400 | 查询参数格式不正确 | 验证status、page、limit参数 |
| 数据库错误 | 500 | 数据库查询异常 | 检查索引和查询条件 |
| 权限错误 | 403 | 用户无访问权限 | 验证用户身份和数据隔离 |

### 性能问题诊断

1. **查询缓慢**
   - 检查索引是否存在
   - 分析查询执行计划
   - 优化分页参数

2. **内存泄漏**
   - 检查数据库连接管理
   - 验证实时订阅清理
   - 监控状态管理器

**章节来源**
- [app/api/trade/orders/route.ts:12-17](file://app/api/trade/orders/route.ts#L12-L17)
- [app/api/trade/orders/route.ts:44-50](file://app/api/trade/orders/route.ts#L44-L50)

## 结论

委托查询API提供了完整的委托记录查询功能，具备以下特点：

1. **功能完整性**：支持状态筛选、分页查询、实时订阅
2. **性能优化**：合理的索引设计和查询优化
3. **用户体验**：前后端协同的实时数据更新
4. **可扩展性**：清晰的架构设计便于功能扩展

该API为虚拟股票交易系统的核心功能之一，为用户提供了便捷的委托记录管理能力。

## 附录

### API使用示例

```javascript
// 基本查询
fetch('/api/trade/orders')

// 状态筛选
fetch('/api/trade/orders?status=pending')

// 分页查询
fetch('/api/trade/orders?page=2&limit=50')

// 组合查询
fetch('/api/trade/orders?status=cancelled&page=1&limit=30')
```

### 最佳实践建议

1. **参数验证**：始终验证查询参数的有效性
2. **错误处理**：完善的错误捕获和用户友好的错误消息
3. **性能监控**：建立查询性能监控机制
4. **安全考虑**：确保用户数据隔离和访问控制
5. **缓存策略**：合理使用缓存提高响应速度