import { create } from 'zustand';
import { Portfolio, Order, Transaction } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { calculateProfitLoss } from '@/lib/trading-rules';

interface TradeState {
  holdings: Portfolio[];
  orders: Order[];
  transactions: Transaction[];
  isLoading: boolean;
  fetchHoldings: () => Promise<void>;
  fetchOrders: (status?: string) => Promise<void>;
  fetchTransactions: () => Promise<void>;
  submitOrder: (order: { 
    symbol: string; 
    type: 'buy' | 'sell'; 
    price: number; 
    quantity: number;
    orderType?: 'limit' | 'market';
    forceNonTrading?: boolean;
  }) => Promise<{ success: boolean; error?: string; data?: Order }>;
  cancelOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  subscribeHoldings: (userId: string) => () => void;
  subscribeOrders: (userId: string) => () => void;
  getHoldingBySymbol: (symbol: string) => Portfolio | undefined;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  holdings: [],
  orders: [],
  transactions: [],
  isLoading: false,

  fetchHoldings: async () => {
    set({ isLoading: true });
    
    try {
      const res = await fetch('/api/trade/positions');
      const data = await res.json();
      
      if (data.data) {
        // 计算每个持仓的盈亏
        const holdingsWithProfit = data.data.map((holding: Portfolio) => {
          if (holding.stock) {
            const { profitLoss, profitLossPercent } = calculateProfitLoss(
              holding.stock.current_price,
              holding.avg_cost,
              holding.quantity
            );
            return {
              ...holding,
              market_value: holding.quantity * holding.stock.current_price,
              profit_loss: profitLoss,
              profit_loss_percent: profitLossPercent,
            };
          }
          return holding;
        });
        
        set({ holdings: holdingsWithProfit });
      }
    } catch (error) {
      console.error('Failed to fetch holdings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrders: async (status?: string) => {
    set({ isLoading: true });
    
    try {
      const url = status ? `/api/trade/orders?status=${status}` : '/api/trade/orders';
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.data) {
        set({ orders: data.data });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async () => {
    try {
      const res = await fetch('/api/trade/transactions');
      const data = await res.json();
      
      if (data.data) {
        set({ transactions: data.data });
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  },

  submitOrder: async (order) => {
    try {
      const res = await fetch('/api/trade/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || '下单失败' };
      }
      
      // 刷新持仓和订单列表
      await get().fetchHoldings();
      await get().fetchOrders();
      
      return { success: true, data };
    } catch {
      return { success: false, error: '网络错误' };
    }
  },

  cancelOrder: async (orderId: string) => {
    try {
      const res = await fetch(`/api/trade/order/${orderId}`, { 
        method: 'DELETE' 
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || '撤单失败' };
      }
      
      // 刷新订单列表
      await get().fetchOrders();
      
      return { success: true };
    } catch {
      return { success: false, error: '网络错误' };
    }
  },

  subscribeHoldings: (userId: string) => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`portfolios-${userId}`)
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'portfolios', 
          filter: `user_id=eq.${userId}` 
        }, 
        () => {
          get().fetchHoldings();
        }
      )
      .subscribe();
    
    return () => channel.unsubscribe();
  },

  subscribeOrders: (userId: string) => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`orders-${userId}`)
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders', 
          filter: `user_id=eq.${userId}` 
        }, 
        () => {
          get().fetchOrders();
        }
      )
      .subscribe();
    
    return () => channel.unsubscribe();
  },

  getHoldingBySymbol: (symbol: string) => {
    return get().holdings.find(h => h.stock_symbol === symbol);
  },
}));
