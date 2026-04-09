import { create } from 'zustand';
import { Stock, WatchlistItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { API_CONSTANTS } from '@/lib/constants';

interface StockState {
  stocks: Stock[];
  watchlist: Stock[];
  searchKeyword: string;
  isLoading: boolean;
  currentPage: number;
  totalCount: number;
  setSearchKeyword: (kw: string) => void;
  fetchStocks: (keyword?: string, page?: number) => Promise<void>;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (symbol: string) => Promise<{ error?: string }>;
  removeFromWatchlist: (symbol: string) => Promise<{ error?: string }>;
  subscribePrices: (symbols?: string[]) => () => void;
  updateStockPrice: (symbol: string, price: number, updated_at: string) => void;
  getStockBySymbol: (symbol: string) => Stock | undefined;
}

export const useStockStore = create<StockState>((set, get) => ({
  stocks: [],
  watchlist: [],
  searchKeyword: '',
  isLoading: false,
  currentPage: 1,
  totalCount: 0,

  setSearchKeyword: (kw) => set({ searchKeyword: kw }),

  fetchStocks: async (keyword?: string, page = 1) => {
    set({ isLoading: true });
    
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('q', keyword);
      params.append('page', page.toString());
      params.append('limit', API_CONSTANTS.DEFAULT_PAGE_SIZE.toString());
      
      const res = await fetch(`/api/stocks?${params}`);
      const data = await res.json();
      
      if (data.data) {
        set({ 
          stocks: data.data,
          currentPage: page,
          totalCount: data.total || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchWatchlist: async () => {
    set({ isLoading: true });
    
    try {
      const res = await fetch('/api/watchlist');
      const data = await res.json();
      
      if (data.data) {
        // 将 watchlist 项转换为 Stock 格式
        const watchlistStocks: Stock[] = data.data.map((item: WatchlistItem & { stock: Stock }) => ({
          ...item.stock,
        }));
        set({ watchlist: watchlistStocks });
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToWatchlist: async (symbol: string) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { error: data.error || '添加失败' };
      }
      
      // 刷新自选股列表
      await get().fetchWatchlist();
      return {};
    } catch {
      return { error: '网络错误' };
    }
  },

  removeFromWatchlist: async (symbol: string) => {
    try {
      const res = await fetch(`/api/watchlist/${symbol}`, { 
        method: 'DELETE' 
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { error: data.error || '移除失败' };
      }
      
      // 更新本地状态
      set((state) => ({
        watchlist: state.watchlist.filter(s => s.symbol !== symbol)
      }));
      
      return {};
    } catch {
      return { error: '网络错误' };
    }
  },

  subscribePrices: (symbols?: string[]) => {
    const supabase = createClient();
    
    const filter = symbols?.length 
      ? `symbol=in.(${symbols.join(',')})` 
      : undefined;
    
    const channel = supabase
      .channel('stocks-realtime')
      .on(
        'postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'stocks',
          filter 
        }, 
        (payload) => {
          const { symbol, current_price, updated_at } = payload.new as Stock;
          get().updateStockPrice(symbol, current_price, updated_at);
        }
      )
      .subscribe();
    
    return () => channel.unsubscribe();
  },

  updateStockPrice: (symbol, price, updated_at) => {
    set((state) => ({
      stocks: state.stocks.map(s => 
        s.symbol === symbol 
          ? { 
              ...s, 
              current_price: price, 
              updated_at,
              change: price - s.prev_close,
              change_percent: ((price - s.prev_close) / s.prev_close) * 100
            } 
          : s
      ),
      watchlist: state.watchlist.map(s => 
        s.symbol === symbol 
          ? { 
              ...s, 
              current_price: price, 
              updated_at,
              change: price - s.prev_close,
              change_percent: ((price - s.prev_close) / s.prev_close) * 100
            } 
          : s
      ),
    }));
  },

  getStockBySymbol: (symbol: string) => {
    const { stocks, watchlist } = get();
    return stocks.find(s => s.symbol === symbol) || watchlist.find(s => s.symbol === symbol);
  },
}));
