import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, ToastMessage } from '@/types';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  toasts: ToastMessage[];
  isMobile: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  showToast: (message: string, type?: ToastMessage['type']) => void;
  hideToast: (id: string) => void;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      activeModal: null,
      toasts: [],
      isMobile: false,

      setTheme: (theme) => {
        set({ theme });
        // 同步到 document
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(theme);
        }
      },

      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),

      openModal: (id) => set({ activeModal: id }),
      
      closeModal: () => set({ activeModal: null }),

      showToast: (message, type = 'info') => {
        const id = Math.random().toString(36).substring(7);
        const toast: ToastMessage = { id, message, type };
        
        set((state) => ({ 
          toasts: [...state.toasts, toast] 
        }));

        // 3秒后自动隐藏
        setTimeout(() => {
          get().hideToast(id);
        }, 3000);
      },

      hideToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      setIsMobile: (isMobile) => set({ isMobile }),
    }),
    { 
      name: 'ui-storage', 
      partialize: (state) => ({ 
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
