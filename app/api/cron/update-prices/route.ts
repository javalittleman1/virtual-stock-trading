import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isTradingHour } from '@/lib/trading-rules';
import { API_CONSTANTS } from '@/lib/constants';

const ITICK_API_KEY = process.env.ITICK_API_KEY!;
const ITICK_API_ENDPOINT = process.env.ITICK_API_ENDPOINT || 'https://api.itick.org/v1';

// GET /api/cron/update-prices - 定时更新股票价格
export async function GET(request: NextRequest) {
  try {
    // 验证 Cron Secret（如果配置了）
    const cronSecret = request.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 检查是否在交易时间
    if (!isTradingHour()) {
      return NextResponse.json({ 
        message: '非交易时段，跳过更新',
        isTradingHour: false 
      });
    }

    const supabase = await createClient();

    // 获取所有股票代码
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('symbol')
      .order('symbol');

    if (stocksError) {
      console.error('Error fetching stocks:', stocksError);
      return NextResponse.json(
        { error: '获取股票列表失败' },
        { status: 500 }
      );
    }

    if (!stocks || stocks.length === 0) {
      return NextResponse.json({ 
        message: '没有需要更新的股票',
        updated: 0 
      });
    }

    const symbols = stocks.map(s => s.symbol);
    const batchSize = API_CONSTANTS.ITICK_BATCH_SIZE;
    let updatedCount = 0;
    let errorCount = 0;

    // 分批获取行情数据
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      try {
        const response = await fetch(
          `${ITICK_API_ENDPOINT}/quotes?symbols=${batch.join(',')}`,
          {
            headers: {
              'Authorization': `Bearer ${ITICK_API_KEY}`,
              'Content-Type': 'application/json',
            },
            // 10秒超时
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!response.ok) {
          console.error(`API error for batch ${i}:`, response.statusText);
          errorCount += batch.length;
          continue;
        }

        const result = await response.json();
        
        if (!result.data || !Array.isArray(result.data)) {
          console.error('Invalid API response:', result);
          errorCount += batch.length;
          continue;
        }

        // 准备更新数据
        const updates = result.data.map((item: {
          symbol: string;
          price?: number;
          prev_close?: number;
          open?: number;
          high?: number;
          low?: number;
          volume?: number;
        }) => ({
          symbol: item.symbol,
          current_price: item.price || 0,
          prev_close: item.prev_close || 0,
          open: item.open || 0,
          high: item.high || 0,
          low: item.low || 0,
          volume: item.volume || 0,
          updated_at: new Date().toISOString(),
        }));

        // 批量更新到 Supabase
        const { error: upsertError } = await supabase
          .from('stocks')
          .upsert(updates, { 
            onConflict: 'symbol',
          });

        if (upsertError) {
          console.error('Error upserting stocks:', upsertError);
          errorCount += updates.length;
        } else {
          updatedCount += updates.length;
        }

      } catch (error) {
        console.error(`Error processing batch ${i}:`, error);
        errorCount += batch.length;
      }

      // 添加小延迟，避免请求过快
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      errors: errorCount,
      total: symbols.length,
      isTradingHour: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in update-prices API:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
