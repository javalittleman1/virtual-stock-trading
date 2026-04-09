# API 接口规范

| 文档版本 | 修改日期   | 修改内容             |
| -------- | ---------- | -------------------- |
| V1.0     | 2026-04-09 | 初稿，覆盖 MVP 接口  |

---

## 1. 概述

- **Base URL**：`/api`
- **认证方式**：所有需要用户身份的接口均通过 Supabase Auth 的 JWT Token 鉴权，在请求头中携带 `Authorization: Bearer <token>`。
- **数据格式**：JSON。
- **实时通信**：行情与持仓变更通过 Supabase Realtime 订阅数据库变更，不单独定义 WebSocket 接口。

---

## 2. 用户与账户模块

### 2.1 获取当前用户资料

**GET** `/user/profile`

> **MVP 范围**：P0

**请求头**：
```
Authorization: Bearer <token>
```

**响应示例**：
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "virtual_balance": 1000000.00,
  "created_at": "2026-04-09T08:00:00Z"
}
```

---

### 2.2 重置账户资金与持仓

**POST** `/user/reset`

> **MVP 范围**：P2（非 MVP）

**请求头**：
```
Authorization: Bearer <token>
```

**响应示例**：
```json
{
  "success": true,
  "virtual_balance": 1000000.00,
  "message": "账户已重置"
}
```

---

## 3. 行情数据模块

### 3.1 获取股票列表

**GET** `/stocks`

> **MVP 范围**：P0

**查询参数**：

| 参数   | 类型   | 必填 | 说明                         |
| ------ | ------ | ---- | ---------------------------- |
| q      | string | 否   | 搜索关键词（代码或名称）     |
| page   | number | 否   | 页码，默认 1                 |
| limit  | number | 否   | 每页数量，默认 20，最大 100  |

**响应示例**：
```json
{
  "data": [
    {
      "symbol": "600519",
      "name": "贵州茅台",
      "market": "A",
      "current_price": 1685.00,
      "prev_close": 1683.18,
      "open": 1684.00,
      "high": 1692.50,
      "low": 1678.00,
      "volume": 1234567,
      "change": 1.82,
      "change_percent": 0.11,
      "updated_at": "2026-04-09T10:30:00Z"
    }
  ],
  "total": 5000,
  "page": 1,
  "limit": 20
}
```

---

### 3.2 获取单只股票实时行情

**GET** `/stocks/:symbol`

> **MVP 范围**：P0

**路径参数**：

| 参数   | 类型   | 说明     |
| ------ | ------ | -------- |
| symbol | string | 股票代码 |

**响应示例**：
```json
{
  "symbol": "600519",
  "name": "贵州茅台",
  "market": "A",
  "current_price": 1685.00,
  "prev_close": 1683.18,
  "open": 1684.00,
  "high": 1692.50,
  "low": 1678.00,
  "volume": 1234567,
  "change": 1.82,
  "change_percent": 0.11,
  "updated_at": "2026-04-09T10:30:00Z"
}
```

---

### 3.3 获取 K 线数据

**GET** `/stocks/:symbol/kline`

> **MVP 范围**：P1

**路径参数**：

| 参数   | 类型   | 说明     |
| ------ | ------ | -------- |
| symbol | string | 股票代码 |

**查询参数**：

| 参数   | 类型   | 必填 | 说明                                     |
| ------ | ------ | ---- | ---------------------------------------- |
| period | string | 是   | K 线周期：`day`、`week`、`month`         |
| limit  | number | 否   | 返回数据条数，默认 100，最大 500         |

**响应示例**：
```json
{
  "symbol": "600519",
  "period": "day",
  "data": [
    {
      "date": "2026-04-08",
      "open": 1680.00,
      "high": 1690.00,
      "low": 1675.00,
      "close": 1683.18,
      "volume": 2345678
    }
  ]
}
```

---

## 4. 自选股模块

### 4.1 获取自选股列表

**GET** `/watchlist`

> **MVP 范围**：P0

**请求头**：
```
Authorization: Bearer <token>
```

**响应示例**：
```json
{
  "data": [
    {
      "symbol": "600519",
      "name": "贵州茅台",
      "current_price": 1685.00,
      "change_percent": 0.11,
      "added_at": "2026-04-01T08:00:00Z"
    }
  ]
}
```

---

### 4.2 添加自选股

**POST** `/watchlist`

> **MVP 范围**：P0

**请求头**：
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "symbol": "600519"
}
```

**响应示例**：
```json
{
  "success": true,
  "symbol": "600519"
}
```

---

### 4.3 移除自选股

**DELETE** `/watchlist/:symbol`

> **MVP 范围**：P0

**请求头**：
```
Authorization: Bearer <token>
```

**响应示例**：
```json
{
  "success": true,
  "symbol": "600519"
}
```

---

## 5. 交易模块

### 5.1 提交委托订单

**POST** `/trade/order`

> **MVP 范围**：P0

**请求头**：
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "symbol": "600519",
  "type": "buy",
  "price": 1685.00,
  "quantity": 100
}
```
| 字段     | 类型   | 说明                                       |
| -------- | ------ | ------------------------------------------ |
| symbol   | string | 股票代码                                   |
| type     | string | `buy` 或 `sell`                            |
| price    | number | 委托价格（市价单可传 0，后端按最新价成交） |
| quantity | number | 委托数量（股，必须为 100 的整数倍）        |

**响应示例**：
```json
{
  "order_id": "uuid",
  "symbol": "600519",
  "type": "buy",
  "price": 1685.00,
  "quantity": 100,
  "filled_quantity": 100,
  "status": "filled",
  "fee": 4.21,
  "created_at": "2026-04-09T10:30:00Z"
}
```
> 状态说明：`filled`（全部成交）、`partial`（部分成交）、`cancelled`（已撤销）、`pending`（等待成交，仅限限价单）。

---

### 5.2 获取当前持仓

**GET** `/trade/positions`

> **MVP 范围**：P0

**请求头**：
```
Authorization: Bearer <token>
```

**响应示例**：
```json
{
  "data": [
    {
      "symbol": "600519",
      "name": "贵州茅台",
      "quantity": 200,
      "avg_cost": 1620.50,
      "current_price": 1685.00,
      "market_value": 337000.00,
      "profit_loss": 12900.00,
      "profit_loss_percent": 3.98
    }
  ]
}
```

---

### 5.3 获取委托记录

**GET** `/trade/orders`

> **MVP 范围**：P1

**请求头**：
```
Authorization: Bearer <token>
```

**查询参数**：

| 参数   | 类型   | 必填 | 说明                                     |
| ------ | ------ | ---- | ---------------------------------------- |
| status | string | 否   | 筛选状态：`filled`、`pending`、`cancelled` |
| page   | number | 否   | 页码，默认 1                             |
| limit  | number | 否   | 每页数量，默认 20                        |

**响应示例**：
```json
{
  "data": [
    {
      "order_id": "uuid",
      "symbol": "600519",
      "type": "buy",
      "price": 1685.00,
      "quantity": 100,
      "filled_quantity": 100,
      "status": "filled",
      "fee": 4.21,
      "created_at": "2026-04-09T10:30:00Z"
    }
  ],
  "total": 48,
  "page": 1,
  "limit": 20
}
```

---

### 5.4 撤销委托订单

**DELETE** `/trade/order/:orderId`

> **MVP 范围**：P1

**请求头**：
```
Authorization: Bearer <token>
```

**响应示例**：
```json
{
  "success": true,
  "order_id": "uuid",
  "status": "cancelled"
}
```

---

## 6. 交易复盘模块

### 6.1 获取交易统计

**GET** `/trade/statistics`

> **MVP 范围**：P1

**请求头**：
```
Authorization: Bearer <token>
```

**响应示例**：
```json
{
  "total_trades": 48,
  "win_rate": 62.5,
  "avg_profit": 1250.30,
  "avg_loss": -820.50,
  "max_profit": 8500.00,
  "max_loss": -3200.00,
  "max_drawdown": -8.32,
  "sharpe_ratio": 1.25
}
```

---

### 6.2 获取收益走势数据

**GET** `/trade/performance`

> **MVP 范围**：P1

**请求头**：
```
Authorization: Bearer <token>
```

**查询参数**：

| 参数      | 类型   | 必填 | 说明                                   |
| --------- | ------ | ---- | -------------------------------------- |
| start_date | string | 否   | 开始日期（YYYY-MM-DD），默认 30 天前   |
| end_date   | string | 否   | 结束日期（YYYY-MM-DD），默认今日       |

**响应示例**：
```json
{
  "data": [
    {
      "date": "2026-03-10",
      "total_asset": 1000000.00,
      "daily_return": 0.00,
      "cumulative_return": 0.00,
      "benchmark_return": 0.00
    }
  ]
}
```

---

## 7. 策略分析模块（P1）

### 7.1 获取首板观察池

**GET** `/analysis/first-board`

> **MVP 范围**：P1

**响应示例**：
```json
{
  "date": "2026-04-09",
  "data": [
    {
      "symbol": "002456",
      "name": "欧菲光",
      "concepts": ["消费电子", "华为概念"],
      "seal_ratio": 3.2
    }
  ]
}
```

---

### 7.2 获取五大回调战法信号

**GET** `/analysis/signals`

> **MVP 范围**：P1

**查询参数**：

| 参数       | 类型   | 必填 | 说明                                 |
| ---------- | ------ | ---- | ------------------------------------ |
| signal_type | string | 否   | 筛选特定战法，不传则返回全部         |

**响应示例**：
```json
{
  "data": [
    {
      "signal_type": "three_shadows",
      "name": "三阴不破阳",
      "symbol": "600519",
      "stock_name": "贵州茅台",
      "support_price": 1680.00,
      "signal_active": true,
      "updated_at": "2026-04-09T14:30:00Z"
    }
  ]
}
```

---

### 7.3 订阅/更新预警条件

**POST** `/analysis/alert/subscribe`

> **MVP 范围**：P1

**请求头**：
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "symbol": "600519",
  "pressure_break": true,
  "tail_confirm": false,
  "stop_loss_percent": 5.0
}
```

**响应示例**：
```json
{
  "success": true
}
```

---

## 8. 系统管理接口（P2，非 MVP）

| 方法   | 路径                    | 说明               |
| ------ | ----------------------- | ------------------ |
| GET    | `/admin/users`          | 获取用户列表       |
| POST   | `/admin/users/:id/reset`| 重置用户密码       |
| POST   | `/admin/announcement`   | 发布系统公告       |
| PUT    | `/admin/datasource`     | 切换数据源 API Key |

> P2 接口暂不详细展开，后续迭代补充。

---

## 9. 错误码规范

| 状态码 | 含义               | 示例响应                                                     |
| ------ | ------------------ | ------------------------------------------------------------ |
| 400    | 请求参数错误       | `{ "error": "invalid_quantity", "message": "数量必须为100的整数倍" }` |
| 401    | 未认证             | `{ "error": "unauthorized" }`                                |
| 403    | 无权限             | `{ "error": "forbidden", "message": "交易时间外不可下单" }`  |
| 404    | 资源不存在         | `{ "error": "not_found" }`                                   |
| 429    | 请求频率超限       | `{ "error": "rate_limited" }`                                |
| 500    | 服务器内部错误     | `{ "error": "internal_server_error" }`                       |
