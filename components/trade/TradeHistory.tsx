'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTradeStore } from '@/stores/useTradeStore';
import { useUIStore } from '@/stores/useUIStore';
import { Order } from '@/types';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { X } from 'lucide-react';

export function TradeHistory() {
  const { orders, isLoading, fetchOrders, cancelOrder } = useTradeStore();
  const { showToast } = useUIStore();
  const [filter, setFilter] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders(filter === 'all' ? undefined : filter);
  }, [fetchOrders, filter]);

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    const result = await cancelOrder(orderId);
    setCancellingId(null);

    if (result.success) {
      showToast('撤单成功', 'success');
    } else {
      showToast(result.error || '撤单失败', 'error');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      filled: { variant: 'default', label: '已成交' },
      pending: { variant: 'secondary', label: '委托中' },
      partial: { variant: 'outline', label: '部分成交' },
      cancelled: { variant: 'destructive', label: '已撤销' },
    };
    
    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">委托记录</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">委托记录</h3>
        <div className="flex gap-1">
          {['all', 'filled', 'pending'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : f === 'filled' ? '已成交' : '委托中'}
            </Button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无委托记录
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {orders.map((order) => (
            <div
              key={order.order_id}
              className="p-3 bg-muted rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium",
                    order.type === 'buy' ? "text-red-500" : "text-green-500"
                  )}>
                    {order.type === 'buy' ? '买入' : '卖出'}
                  </span>
                  <span className="text-sm">{order.symbol}</span>
                  {order.name && (
                    <span className="text-sm text-muted-foreground">{order.name}</span>
                  )}
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">委托价: </span>
                  <span>{formatCurrency(order.price)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">数量: </span>
                  <span>{formatNumber(order.quantity)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">成交: </span>
                  <span>{formatNumber(order.filled_quantity)}</span>
                </div>
              </div>

              {order.fee !== undefined && order.fee > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">手续费: </span>
                  <span>{formatCurrency(order.fee)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(order.created_at), 'MM-dd HH:mm', { locale: zhCN })}
                </span>
                
                {order.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-red-500 hover:text-red-600"
                    onClick={() => handleCancel(order.order_id)}
                    disabled={cancellingId === order.order_id}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {cancellingId === order.order_id ? '撤销中...' : '撤单'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
