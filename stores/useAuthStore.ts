import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) => {
    set({ 
      session, 
      user: session?.user ?? null,
      isLoading: false 
    });
  },

  signIn: async (email, password) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      return { error: error.message };
    }
    
    set({ 
      session: data.session, 
      user: data.user,
      isLoading: false 
    });
    return {};
  },

  signUp: async (email, password) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      return { error: error.message };
    }
    
    if (data.user?.identities?.length === 0) {
      return { message: '该邮箱已注册，请直接登录' };
    }
    
    return { message: '注册成功，请查收验证邮件' };
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ 
      session: null, 
      user: null,
      isLoading: false 
    });
  },

  initialize: () => {
    const supabase = createClient();
    
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ 
        session, 
        user: session?.user ?? null, 
        isLoading: false,
        isInitialized: true 
      });
    });

    // 监听认证状态变化
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ 
        session, 
        user: session?.user ?? null,
        isLoading: false 
      });
    });
  },
}));
