import { ItemCategory } from "../types/item";

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  engineering: "Kỹ thuật",
  design: "Thiết kế UI/UX",
  marketing: "Truyền thông",
  product: "Sản phẩm",
};

export function formatCategoryLabel(category: ItemCategory): string {
  return CATEGORY_LABELS[category] || category;
}

export function getCategoryBadgeColor(category: ItemCategory): "default" | "secondary" | "outline" {
  switch (category) {
    case "engineering":
      return "default";
    case "design":
      return "secondary";
    default:
      return "outline";
  }
}

