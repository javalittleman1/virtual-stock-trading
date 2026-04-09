'use client';

import { useEffect, useState, useCallback } from 'react';
import { StockCard } from './StockCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStockStore } from '@/stores/useStockStore';
import { useUIStore } from '@/stores/useUIStore';
import { Stock } from '@/types';

interface StockListProps {
  onStockClick?: (stock: Stock) => void;
  showAddButton?: boolean;
  watchlistSymbols?: string[];
}

export function StockList({ 
  onStockClick, 
  showAddButton = false,
  watchlistSymbols = []
}: StockListProps) {
  const { 
    stocks, 
    searchKeyword, 
    setSearchKeyword, 
    fetchStocks, 
    isLoading,
    currentPage,
    totalCount
  } = useStockStore();
  const { isMobile } = useUIStore();
  const [inputValue, setInputValue] = useState(searchKeyword);

  // 加载股票数据
  useEffect(() => {
    fetchStocks(searchKeyword, currentPage);
  }, [fetchStocks, searchKeyword, currentPage]);

  // 搜索防抖
  const handleSearch = useCallback(() => {
    setSearchKeyword(inputValue);
  }, [inputValue, setSearchKeyword]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索股票代码或名称..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
            type="search"
            inputMode="search"
          />
        </div>
        <Button onClick={handleSearch}>
          搜索
        </Button>
      </div>

      {/* 股票列表 */}
      <div className="space-y-3">
        {isLoading ? (
          // 加载骨架屏
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : stocks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            没有找到相关股票
          </div>
        ) : (
          stocks.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              showAddButton={showAddButton}
              isInWatchlist={watchlistSymbols.includes(stock.symbol)}
              onClick={() => onStockClick?.(stock)}
              compact={isMobile}
            />
          ))
        )}
      </div>

      {/* 分页 */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStocks(searchKeyword, currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStocks(searchKeyword, currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 总数提示 */}
      {!isLoading && (
        <div className="text-center text-sm text-muted-foreground">
          共 {totalCount} 条记录
        </div>
      )}
    </div>
  );
}
