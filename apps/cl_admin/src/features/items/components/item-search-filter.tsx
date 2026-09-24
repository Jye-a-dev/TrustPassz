"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useItemFilters } from "../hooks/use-items";
import { ItemCategory } from "../types/item";

const CATEGORIES: { label: string; value: string }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Kỹ thuật", value: "engineering" },
  { label: "Thiết kế", value: "design" },
  { label: "Sản phẩm", value: "product" },
];

export function ItemSearchFilter() {
  const { search, setSearch, category, setCategory } = useItemFilters();

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm tài nguyên, mô-đun..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={category === cat.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat.value)}
            className="text-xs shrink-0"
          >
            {cat.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

