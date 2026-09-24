"use server";

import { revalidatePath } from "next/cache";
import { createItemSchema, ActionResult, Item } from "../types/item";

// In-memory mock storage for template demonstration
const globalItems: Item[] = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    title: "Next.js 15+ Core Architecture",
    description: "App Router hiện đại, React Server Components (RSC) tối ưu tải trang và SEO.",
    category: "engineering",
    status: "active",
    createdAt: new Date("2026-03-01T10:00:00Z"),
  },
  {
    id: "a3bb189e-8bf9-3888-9912-ace4e6543002",
    title: "Design System & Micro-Interactions",
    description: "Tailwind CSS v4 + Radix UI Primitives cùng Framer Motion cho trải nghiệm 60fps mượt mà.",
    category: "design",
    status: "active",
    createdAt: new Date("2026-03-02T11:30:00Z"),
  },
  {
    id: "c9a646d3-9c61-4cb7-89cd-783bf2c44b37",
    title: "URL as State với Nuqs",
    description: "Đồng bộ hóa search params 2 chiều an toàn kiểu dữ liệu (type-safe) hỗ trợ SSR mượt mà.",
    category: "product",
    status: "active",
    createdAt: new Date("2026-03-03T15:45:00Z"),
  },
];

export async function getItemsAction(category?: string, search?: string): Promise<Item[]> {
  // Simulate network delay for realistic streaming demonstration
  await new Promise((resolve) => setTimeout(resolve, 350));

  return globalItems.filter((item) => {
    const matchesCategory = !category || category === "all" || item.category === category;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

export async function createItemAction(
  _prevState: ActionResult<Item> | null,
  formData: FormData
): Promise<ActionResult<Item>> {
  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
  };

  const validation = createItemSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      error: "Dữ liệu không hợp lệ",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  const newItem: Item = {
    id: crypto.randomUUID(),
    title: validation.data.title,
    description: validation.data.description,
    category: validation.data.category,
    status: "active",
    createdAt: new Date(),
  };

  globalItems.unshift(newItem);
  revalidatePath("/dashboard");

  return {
    success: true,
    data: newItem,
  };
}

