'use client';

import * as React from 'react';
import {
  AlertOctagon,
  Flame,
  Coins,
  Clock,
  Search,
  ArrowUpDown,
  FilterX,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { EmergencyFilterState, DisputeSortOption } from '@/types/dispute-workbench';

interface EmergencyDisputeFilterProps {
  filterState: EmergencyFilterState;
  onFilterChange: (next: EmergencyFilterState) => void;
  counts: {
    total: number;
    uncertain: number;
    urgent: number;
    highValue: number;
    pendingAdmin: number;
  };
  className?: string;
}

export function EmergencyDisputeFilter({
  filterState,
  onFilterChange,
  counts,
  className,
}: EmergencyDisputeFilterProps) {
  const [showSlider, setShowSlider] = React.useState(false);

  const toggleUncertain = () => {
    onFilterChange({
      ...filterState,
      uncertainOnly: !filterState.uncertainOnly,
    });
  };

  const toggleUrgent = () => {
    onFilterChange({
      ...filterState,
      urgentOnly: !filterState.urgentOnly,
    });
  };

  const toggleHighValue = () => {
    onFilterChange({
      ...filterState,
      highValueOnly: !filterState.highValueOnly,
    });
  };

  const togglePendingAdmin = () => {
    onFilterChange({
      ...filterState,
      pendingAdminOnly: !filterState.pendingAdminOnly,
    });
  };

  const handleResetFilters = () => {
    onFilterChange({
      uncertainOnly: false,
      confidenceThreshold: 0.75,
      urgentOnly: false,
      highValueOnly: false,
      pendingAdminOnly: false,
      searchQuery: '',
      sortBy: 'confidence_asc',
    });
    setShowSlider(false);
  };

  const hasActiveFilters =
    filterState.uncertainOnly ||
    filterState.urgentOnly ||
    filterState.highValueOnly ||
    filterState.pendingAdminOnly ||
    filterState.searchQuery.trim().length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4',
        filterState.uncertainOnly && 'border-amber-300 ring-1 ring-amber-200',
        className
      )}
    >
      {/* Primary Row: Emergency Toggle & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Urgent AI Ambiguity Toggle Switch */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleUncertain}
            className={cn(
              'group flex min-h-[40px] items-center gap-2.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all select-none cursor-pointer',
              filterState.uncertainOnly
                ? 'border-amber-300 bg-amber-50 text-amber-800 shadow-2xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300'
            )}
            aria-pressed={filterState.uncertainOnly}
          >
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md border text-xs',
                filterState.uncertainOnly
                  ? 'border-amber-300 bg-amber-100 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-500'
              )}
            >
              <AlertOctagon className="h-3.5 w-3.5 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="flex items-center gap-1.5 font-mono">
                Ca AI Phân Vân (Conf &lt; {(filterState.confidenceThreshold * 100).toFixed(0)}%)
                <Badge
                  variant={filterState.uncertainOnly ? 'amber' : 'outline'}
                  className="font-mono text-[10px] px-1.5 py-0"
                >
                  {counts.uncertain}
                </Badge>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Ưu tiên ca có AI verdict ESCALATE_TO_ADMIN hoặc độ tin cậy thấp
              </span>
            </div>
          </button>

          {/* Button to tune threshold */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSlider(!showSlider)}
            className="min-h-[40px] border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 font-mono shadow-2xs"
          >
            Ngưỡng: {(filterState.confidenceThreshold * 100).toFixed(0)}%
          </Button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={filterState.searchQuery}
              onChange={(e) =>
                onFilterChange({ ...filterState, searchQuery: e.target.value })
              }
              placeholder="Tìm mã kèo, asset, buyer/seller..."
              className="min-h-[40px] pl-9 bg-white border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-slate-400"
            />
          </div>

          {/* Sort Selector */}
          <div className="relative min-h-[40px]">
            <select
              aria-label="Sắp xếp danh sách tranh chấp"
              value={filterState.sortBy}
              onChange={(e) =>
                onFilterChange({
                  ...filterState,
                  sortBy: e.target.value as DisputeSortOption,
                })
              }
              className="min-h-[40px] w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 pr-8 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
            >
              <option value="confidence_asc">AI Confidence: Thấp → Cao (Ưu tiên)</option>
              <option value="confidence_desc">AI Confidence: Cao → Thấp</option>
              <option value="urgency_desc">Khẩn cấp nhất (&lt; 4h)</option>
              <option value="amount_desc">Giá trị cao nhất (VNĐ)</option>
              <option value="created_desc">Thời gian: Mới nhất</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Threshold Slider Drawer if toggled */}
      {showSlider && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 max-w-md animate-in fade-in-0 duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 font-medium">Ngưỡng tin cậy kích hoạt cảnh báo Admin:</span>
            <span className="font-mono text-amber-700 font-bold">
              {(filterState.confidenceThreshold * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            min={50}
            max={90}
            step={1}
            value={Math.round(filterState.confidenceThreshold * 100)}
            onChange={(val) =>
              onFilterChange({
                ...filterState,
                confidenceThreshold: val / 100,
              })
            }
            unit="%"
          />
          <p className="text-[10px] text-slate-500">
            Các ca có Confidence dưới ngưỡng này sẽ tự động được đánh dấu khẩn cấp trên bàn làm việc.
          </p>
        </div>
      )}

      {/* Quick Filter Badges Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
        <span className="text-[11px] font-mono text-slate-500 mr-1 flex items-center gap-1">
          <FilterX className="h-3 w-3" />
          Bộ lọc nhanh:
        </span>

        {/* Badge 1: Urgent < 4h */}
        <button
          type="button"
          onClick={toggleUrgent}
          className={cn(
            'inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono transition-all cursor-pointer',
            filterState.urgentOnly
              ? 'border-rose-300 bg-rose-50 text-rose-700 font-semibold'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          )}
        >
          <Flame className="h-3.5 w-3.5 text-rose-500" />
          <span>Khẩn cấp (&lt; 4h)</span>
          <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
            {counts.urgent}
          </span>
        </button>

        {/* Badge 2: High Value */}
        <button
          type="button"
          onClick={toggleHighValue}
          className={cn(
            'inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono transition-all cursor-pointer',
            filterState.highValueOnly
              ? 'border-purple-300 bg-purple-50 text-purple-700 font-semibold'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          )}
        >
          <Coins className="h-3.5 w-3.5 text-purple-600" />
          <span>Giá trị cao (&gt; 5M ₫)</span>
          <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-700">
            {counts.highValue}
          </span>
        </button>

        {/* Badge 3: Pending Admin */}
        <button
          type="button"
          onClick={togglePendingAdmin}
          className={cn(
            'inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono transition-all cursor-pointer',
            filterState.pendingAdminOnly
              ? 'border-cyan-300 bg-cyan-50 text-cyan-700 font-semibold'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          )}
        >
          <Clock className="h-3.5 w-3.5 text-cyan-600" />
          <span>Chờ xử lý</span>
          <span className="rounded-full bg-cyan-100 px-1.5 py-0.2 text-[10px] font-bold text-cyan-700">
            {counts.pendingAdmin}
          </span>
        </button>

        {/* Reset button if active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex min-h-[36px] items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-rose-600 ml-auto cursor-pointer"
          >
            <FilterX className="h-3 w-3" />
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}

