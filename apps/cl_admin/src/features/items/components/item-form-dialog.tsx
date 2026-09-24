"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createItemAction } from "../actions/item-actions";
import { ActionResult, Item } from "../types/item";

export function ItemFormDialog() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, isPending] = React.useActionState<ActionResult<Item> | null, FormData>(
    async (prevState, formData) => {
      const result = await createItemAction(prevState, formData);
      if (result.success) {
        toast.success("Đã tạo mục thành công!", {
          description: `Đã thêm: "${result.data?.title}"`,
        });
        setOpen(false);
      } else if (result.error) {
        toast.error("Thao tác thất bại", {
          description: result.error,
        });
      }
      return result;
    },
    null
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span>Thêm mục mới</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Tạo mục tài nguyên</DialogTitle>
          <DialogDescription>
            Điền thông tin bên dưới để khởi tạo một mục mới bằng Server Action.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-foreground">
              Tiêu đề <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              name="title"
              placeholder="VD: Cấu hình ESLint & TypeScript Strict"
              required
            />
            {state?.fieldErrors?.title && (
              <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category" className="text-xs font-semibold text-foreground">
              Chuyên mục <span className="text-destructive">*</span>
            </label>
            <select
              id="category"
              name="category"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue="engineering"
            >
              <option value="engineering" className="bg-background text-foreground">Kỹ thuật</option>
              <option value="design" className="bg-background text-foreground">Thiết kế UI/UX</option>
              <option value="product" className="bg-background text-foreground">Sản phẩm</option>
              <option value="marketing" className="bg-background text-foreground">Truyền thông</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-foreground">
              Mô tả chi tiết <span className="text-destructive">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Nhập tóm tắt mô tả nội dung..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
            {state?.fieldErrors?.description && (
              <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isPending ? "Đang xử lý..." : "Lưu dữ liệu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

