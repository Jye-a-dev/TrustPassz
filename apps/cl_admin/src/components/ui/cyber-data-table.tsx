"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  className?: string;
  headerClassName?: string;
  cell: (item: T, index: number) => React.ReactNode;
}

export interface CyberDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (newPage: number) => void;
  };
  emptyMessage?: string;
  actionsSlot?: React.ReactNode;
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function CyberDataTable<T extends { id?: string | number }>({
  data,
  columns,
  isLoading = false,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm nhanh...",
  pagination,
  emptyMessage = "Không có dữ liệu phù hợp.",
  actionsSlot,
  renderMobileCard,
  className,
}: CyberDataTableProps<T>) {
  const [internalSearch, setInternalSearch] = React.useState(searchQuery ?? "");

  // Debounced search trigger (300ms)
  React.useEffect(() => {
    if (onSearchChange) {
      const timer = setTimeout(() => {
        onSearchChange(internalSearch);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [internalSearch, onSearchChange]);

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize))
    : 1;

  const showSearchOrActions = onSearchChange !== undefined || actionsSlot !== undefined;

  return (
    <div className={cn("space-y-4 w-full", className)}>
      {/* Search & Actions Bar */}
      {showSearchOrActions && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
              <Input
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10 h-10 min-h-10 sm:min-h-11 border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-slate-400"
              />
            </div>
          )}
          {actionsSlot && <div className="flex items-center gap-2">{actionsSlot}</div>}
        </div>
      )}

      {/* Main Table Container (Responsive Horizontal Scroll) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Optional Mobile Card View on small screens */}
        {renderMobileCard && (
          <div className="block lg:hidden divide-y divide-slate-100 p-2">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <Inbox className="size-8 text-slate-300 mb-2" />
                <p className="text-xs">{emptyMessage}</p>
              </div>
            ) : (
              data.map((item, index) => (
                <div key={item.id ? String(item.id) : index} className="p-2">
                  {renderMobileCard(item, index)}
                </div>
              ))
            )}
          </div>
        )}

        {/* Standard Table (always rendered on lg, optionally hidden on mobile if custom card supplied) */}
        <div className={cn("relative w-full overflow-x-auto", renderMobileCard && "hidden lg:block")}>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 px-4",
                      col.headerClassName
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex} className="border-b border-slate-100">
                    {columns.map((col, colIndex) => (
                      <TableCell key={col.key || colIndex} className="py-4 px-4">
                        <Skeleton className="h-4 w-3/4 rounded bg-slate-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Inbox className="size-8 text-slate-300" />
                      <p className="text-xs font-mono">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow
                    key={item.id ? String(item.id) : index}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn("py-3.5 px-4 text-slate-700", col.className)}>
                        {col.cell(item, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {pagination && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xs text-slate-500 font-mono">
              Hiển thị{" "}
              <strong className="text-slate-900">
                {pagination.totalCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-slate-900">
                {Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.totalCount)}
              </strong>{" "}
              trên tổng số <strong className="text-slate-900">{pagination.totalCount}</strong> mục
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => pagination.onPageChange(Math.max(0, pagination.pageIndex - 1))}
                disabled={pagination.pageIndex === 0 || isLoading}
                aria-label="Trang trước"
                className="size-9 sm:size-10 min-h-9 sm:min-h-10 border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-3 py-1 text-xs font-mono text-slate-600">
                Trang {pagination.pageIndex + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
                disabled={pagination.pageIndex + 1 >= totalPages || isLoading}
                aria-label="Trang kế tiếp"
                className="size-9 sm:size-10 min-h-9 sm:min-h-10 border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

