import { create } from 'zustand';
import { Profile, AssetOverview } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface UserState {
  profile: Profile | null;
  assetOverview: AssetOverview | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  calculateAssetOverview: (positions: Array<{ quantity: number; avg_cost: number; current_price: number }>) => void;
  subscribeProfile: (userId: string) => () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  assetOverview: null,
  isLoading: false,

  fetchProfile: async () => {
    const { profile } = get();
    if (!profile?.id) return;

    set({ isLoading: true });
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single();
    
    if (!error && data) {
      set({ profile: data as Profile });
    }
    set({ isLoading: false });
  },

  updateBalance: (newBalance: number) => {
    const { profile, assetOverview } = get();
    if (profile) {
      set({ 
        profile: { ...profile, virtual_balance: newBalance },
        assetOverview: assetOverview ? {
          ...assetOverview,
          available_balance: newBalance,
          total_assets: newBalance + assetOverview.position_value
        } : null
      });
    }
  },

  calculateAssetOverview: (positions) => {
    const { profile } = get();
    if (!profile) return;

    const availableBalance = profile.virtual_balance;
    let positionValue = 0;
    let totalCost = 0;

    positions.forEach(pos => {
      positionValue += pos.quantity * pos.current_price;
      totalCost += pos.quantity * pos.avg_cost;
    });

    const totalAssets = availableBalance + positionValue;
    const totalProfitLoss = positionValue - totalCost;
    const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    // 假设初始资金为 1,000,000
    const initialBalance = 1000000;
    const dailyProfitLoss = totalAssets - initialBalance;
    const dailyProfitLossPercent = (dailyProfitLoss / initialBalance) * 100;

    set({
      assetOverview: {
        total_assets: Math.round(totalAssets * 100) / 100,
        available_balance: Math.round(availableBalance * 100) / 100,
        position_value: Math.round(positionValue * 100) / 100,
        total_profit_loss: Math.round(totalProfitLoss * 100) / 100,
        total_profit_loss_percent: Math.round(totalProfitLossPercent * 100) / 100,
        daily_profit_loss: Math.round(dailyProfitLoss * 100) / 100,
        daily_profit_loss_percent: Math.round(dailyProfitLossPercent * 100) / 100,
      }
    });
  },

  subscribeProfile: (userId: string) => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${userId}` 
        },
        (payload) => {
          set({ profile: payload.new as Profile });
        }
      )
      .subscribe();
    
    return () => channel.unsubscribe();
  },
}));
