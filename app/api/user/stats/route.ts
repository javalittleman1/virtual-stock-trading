import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/user/stats - 获取用户交易统计数据
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 获取所有已成交订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'filled')
      .order('created_at', { ascending: true });

    if (ordersError) {
      return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
    }

    const totalTrades = orders?.length || 0;

    if (totalTrades === 0) {
      return NextResponse.json({
        total_trades: 0,
        win_rate: 0,
        max_drawdown: 0,
        total_return_rate: 0,
      });
    }

    // 计算胜率：按股票代码配对买卖，卖出价 > 买入均价则为盈利
    const buyMap: Record<string, { totalCost: number; quantity: number }> = {};
    let winCount = 0;
    let sellCount = 0;

    for (const order of orders || []) {
      if (order.type === 'buy') {
        if (!buyMap[order.stock_symbol]) {
          buyMap[order.stock_symbol] = { totalCost: 0, quantity: 0 };
        }
        buyMap[order.stock_symbol].totalCost += order.price * order.quantity;
        buyMap[order.stock_symbol].quantity += order.quantity;
      } else if (order.type === 'sell') {
        const buyInfo = buyMap[order.stock_symbol];
        if (buyInfo && buyInfo.quantity > 0) {
          const avgBuyPrice = buyInfo.totalCost / buyInfo.quantity;
          sellCount++;
          if (order.price > avgBuyPrice) winCount++;
          // 减少持仓计数
          const soldQty = Math.min(order.quantity, buyInfo.quantity);
          const costReduced = avgBuyPrice * soldQty;
          buyInfo.totalCost -= costReduced;
          buyInfo.quantity -= soldQty;
        }
      }
    }

    const winRate = sellCount > 0 ? Math.round((winCount / sellCount) * 1000) / 10 : 0;

    // 获取用户profile计算总收益率
    const { data: profile } = await supabase
      .from('profiles')
      .select('virtual_balance')
      .eq('id', user.id)
      .single();

    // 获取当前持仓市值
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('quantity, avg_cost, stock_symbol, stocks(current_price)')
      .eq('user_id', user.id);

    let positionValue = 0;
    if (portfolios) {
      for (const p of portfolios) {
        const stockData = p.stocks as unknown as { current_price: number } | null;
        const price = stockData?.current_price || p.avg_cost;
        positionValue += p.quantity * price;
      }
    }

    const totalAssets = (profile?.virtual_balance || 0) + positionValue;
    const initialBalance = 1000000;
    const totalReturnRate = Math.round(((totalAssets - initialBalance) / initialBalance) * 10000) / 100;

    return NextResponse.json({
      total_trades: totalTrades,
      win_rate: winRate,
      max_drawdown: 0, // 复杂计算需历史净值数据，暂为0
      total_return_rate: totalReturnRate,
    });
  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
