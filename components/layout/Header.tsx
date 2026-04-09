'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Search, Bell, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useTheme } from 'next-themes';

export function Header() {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchValue('');
    }
  };

  const handleSearchClear = () => {
    setShowSearch(false);
    setSearchValue('');
  };

  void showToast;

  if (!user) return null;

  return (
    <>
      {/* 状态栏 */}
      <div
        className="sticky top-0 z-50 px-5 flex items-center justify-between h-14"
        style={{ background: 'var(--guzhang-bg-app)', borderBottom: '1px solid var(--guzhang-border-light)' }}
      >
        {/* Logo — 移动端显示，桌面端隐藏（有侧边栏时不需要） */}
        <Link href="/stocks" className="flex items-center gap-2 lg:hidden">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-bold text-xl" style={{ color: 'var(--guzhang-text-primary)' }}>股掌</span>
        </Link>
        {/* 桌面端占位，保持右侧图标对齐 */}
        <div className="hidden lg:block" />

        {/* 右侧图标 */}
        <div className="flex items-center gap-5">
          <button onClick={handleSearchToggle} className="p-1" style={{ color: 'var(--guzhang-text-secondary)' }}>
            <Search className="h-5 w-5" />
          </button>
          <button className="p-1" style={{ color: 'var(--guzhang-text-secondary)' }}>
            <Bell className="h-5 w-5" />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1"
            style={{ color: 'var(--guzhang-text-secondary)' }}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 搜索框 */}
      {showSearch && (
        <div className="px-4 py-2 sticky top-14 z-40" style={{ background: 'var(--guzhang-bg-app)' }}>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-[48px]"
            style={{
              background: 'var(--guzhang-card-bg)',
              border: '1px solid var(--guzhang-input-border)'
            }}
          >
            <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--guzhang-text-secondary)' }} />
            <input
              autoFocus
              type="text"
              placeholder="搜索代码或名称"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base py-1"
              style={{ color: 'var(--guzhang-text-primary)' }}
            />
            <button
              onClick={handleSearchClear}
              className="px-3 py-1 rounded-[40px] text-sm font-medium text-white bg-primary"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </>
  );
}
