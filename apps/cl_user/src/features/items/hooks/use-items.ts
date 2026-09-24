"use client";

import { useQueryState, parseAsString } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getItemsAction } from "../actions/item-actions";
import { Item } from "../types/item";

export function useItemFilters() {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false, throttleMs: 300 })
  );

  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault("all").withOptions({ shallow: false })
  );

  return {
    search,
    setSearch,
    category,
    setCategory,
  };
}

export function useItemsQuery(initialData?: Item[]) {
  const { search, category } = useItemFilters();

  return useQuery({
    queryKey: ["items", category, search],
    queryFn: () => getItemsAction(category, search),
    initialData,
  });
}

