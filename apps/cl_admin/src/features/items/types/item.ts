import { z } from "zod";

export const itemCategorySchema = z.enum(["engineering", "design", "marketing", "product"]);
export type ItemCategory = z.infer<typeof itemCategorySchema>;

export const itemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2, "Tiêu đề phải có ít nhất 2 ký tự"),
  description: z.string().min(5, "Mô tả phải có ít nhất 5 ký tự"),
  category: itemCategorySchema,
  status: z.enum(["active", "pending", "archived"]).default("active"),
  createdAt: z.string().datetime().or(z.date()),
});

export type Item = z.infer<typeof itemSchema>;

export const createItemSchema = z.object({
  title: z.string().min(2, "Tiêu đề cần ít nhất 2 ký tự"),
  description: z.string().min(5, "Mô tả cần ít nhất 5 ký tự"),
  category: itemCategorySchema,
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

