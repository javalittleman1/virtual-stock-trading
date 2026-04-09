import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  isTradingHour, 
  validateBuyOrder, 
  validateSellOrder,
  calculateTotalCost,
} from '@/lib/trading-rules';

// POST /api/trade/order - 提交委托订单
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { symbol, type, price, quantity, orderType = 'limit' } = body;
    
    // 参数验证
    if (!symbol || !type || !quantity) {
      return NextResponse.json(
        { error: '参数不完整' },
        { status: 400 }
      );
    }
    
    if (type !== 'buy' && type !== 'sell') {
      return NextResponse.json(
        { error: '交易类型错误' },
        { status: 400 }
      );
    }
    
    // 检查交易时间
    if (!isTradingHour()) {
      return NextResponse.json(
        { error: '非交易时间，无法下单' },
        { status: 403 }
      );
    }
    
    // 获取股票信息
    const { data: stock, error: stockError } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol)
      .single();
    
    if (stockError || !stock) {
      return NextResponse.json(
        { error: '股票不存在' },
        { status: 404 }
      );
    }
    
    // 使用市价则按当前价格
    const orderPrice = orderType === 'market' ? stock.current_price : price;
    
    if (!orderPrice || orderPrice <= 0) {
      return NextResponse.json(
        { error: '价格无效' },
        { status: 400 }
      );
    }
    
    // 买入验证
    if (type === 'buy') {
      // 获取用户资金
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('virtual_balance')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        return NextResponse.json(
          { error: '获取用户信息失败' },
          { status: 500 }
        );
      }
      
      const validation = validateBuyOrder(
        symbol,
        orderPrice,
        quantity,
        profile.virtual_balance,
        stock.prev_close
      );
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      
      // 计算费用
      const { amount, fee, total } = calculateTotalCost(orderPrice, quantity, 'buy');
      
      // 开始事务处理
      // 1. 扣除资金
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          virtual_balance: profile.virtual_balance - total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error updating balance:', updateError);
        return NextResponse.json(
          { error: '资金扣除失败' },
          { status: 500 }
        );
      }
      
      // 2. 创建订单记录
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          stock_symbol: symbol,
          type: 'buy',
          price: orderPrice,
          quantity,
          filled_quantity: quantity,
          status: 'filled',
          fee,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        return NextResponse.json(
          { error: '创建订单失败' },
          { status: 500 }
        );
      }
      
      // 3. 创建交易记录
      await supabase.from('transactions').insert({
        user_id: user.id,
        stock_symbol: symbol,
        type: 'buy',
        quantity,
        price: orderPrice,
        fee,
        status: 'filled',
        order_id: order.id,
        created_at: new Date().toISOString(),
      });
      
      // 4. 更新持仓
      const { data: existingPortfolio } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .eq('stock_symbol', symbol)
        .single();
      
      if (existingPortfolio) {
        // 更新现有持仓（计算新的平均成本）
        const totalCost = existingPortfolio.avg_cost * existingPortfolio.quantity + amount;
        const totalQuantity = existingPortfolio.quantity + quantity;
        const newAvgCost = totalCost / totalQuantity;
        
        await supabase
          .from('portfolios')
          .update({
            quantity: totalQuantity,
            avg_cost: Math.round(newAvgCost * 100) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPortfolio.id);
      } else {
        // 创建新持仓
        await supabase.from('portfolios').insert({
          user_id: user.id,
          stock_symbol: symbol,
          quantity,
          avg_cost: orderPrice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      return NextResponse.json({
        order_id: order.id,
        symbol,
        type: 'buy',
        price: orderPrice,
        quantity,
        filled_quantity: quantity,
        status: 'filled',
        fee,
        created_at: order.created_at,
      });
    }
    
    // 卖出验证
    if (type === 'sell') {
      // 获取持仓
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .eq('stock_symbol', symbol)
        .single();
      
      if (portfolioError || !portfolio) {
        return NextResponse.json(
          { error: '没有该股票的持仓' },
          { status: 400 }
        );
      }
      
      const validation = validateSellOrder(
        symbol,
        orderPrice,
        quantity,
        portfolio.quantity,
        stock.prev_close
      );
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      
      // 计算费用
      const { fee, total } = calculateTotalCost(orderPrice, quantity, 'sell');
      
      // 获取用户资金
      const { data: profile } = await supabase
        .from('profiles')
        .select('virtual_balance')
        .eq('id', user.id)
        .single();
      
      // 1. 增加资金
      await supabase
        .from('profiles')
        .update({ 
          virtual_balance: profile!.virtual_balance + total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      // 2. 创建订单记录
      const { data: order } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          stock_symbol: symbol,
          type: 'sell',
          price: orderPrice,
          quantity,
          filled_quantity: quantity,
          status: 'filled',
          fee,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      // 3. 创建交易记录
      await supabase.from('transactions').insert({
        user_id: user.id,
        stock_symbol: symbol,
        type: 'sell',
        quantity,
        price: orderPrice,
        fee,
        status: 'filled',
        order_id: order.id,
        created_at: new Date().toISOString(),
      });
      
      // 4. 更新持仓
      const newQuantity = portfolio.quantity - quantity;
      if (newQuantity > 0) {
        await supabase
          .from('portfolios')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', portfolio.id);
      } else {
        // 清仓，删除持仓记录
        await supabase
          .from('portfolios')
          .delete()
          .eq('id', portfolio.id);
      }
      
      return NextResponse.json({
        order_id: order.id,
        symbol,
        type: 'sell',
        price: orderPrice,
        quantity,
        filled_quantity: quantity,
        status: 'filled',
        fee,
        created_at: order.created_at,
      });
    }
  } catch (error) {
    console.error('Error in order API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
