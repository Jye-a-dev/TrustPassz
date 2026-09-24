import { Suspense } from "react";
import type { Metadata } from "next";
import { ItemList } from "@/features/items/components/item-list";
import { ItemSearchFilter } from "@/features/items/components/item-search-filter";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";
import { getItemsAction } from "@/features/items/actions/item-actions";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Dashboard Quản Trị",
  description: "Bảng điều khiển quản lý tài nguyên, lọc dữ liệu với Nuqs và cập nhật bằng Server Actions.",
};

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = await searchParams;
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : undefined;
  const search = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;

  // Server-side prefetch for fast LCP
  const initialItems = await getItemsAction(category, search);

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard Tài Nguyên</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tài nguyên với kiến trúc Domain-Driven, Nuqs search params và Server Actions.
          </p>
        </div>
        <ItemFormDialog />
      </div>

      <div className="space-y-4">
        <ItemSearchFilter />

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 rounded-xl border p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          }
        >
          <ItemList initialItems={initialItems} />
        </Suspense>
      </div>
    </div>
  );
}

