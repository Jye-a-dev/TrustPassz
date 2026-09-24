"use client";

import * as React from "react";
import { AnimatePresence } from "motion/react";
import { ItemCard } from "./item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useItemsQuery } from "../hooks/use-items";
import { Item } from "../types/item";

interface ItemListProps {
  initialItems?: Item[];
}

export function ItemList({ initialItems }: ItemListProps) {
  const { data: items, isLoading } = useItemsQuery(initialItems);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl border p-6 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy dữ liệu"
        description="Không có mục nào khớp với bộ lọc tìm kiếm hiện tại. Hãy thử thay đổi từ khóa hoặc bộ lọc chuyên mục."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

