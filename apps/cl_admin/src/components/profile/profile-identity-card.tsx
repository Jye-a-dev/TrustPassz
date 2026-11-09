"use client";

import * as React from "react";
import { User, Mail, Calendar, ShieldCheck, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAuthStore } from "@/lib/admin-auth-store";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export function ProfileIdentityCard() {
  const { user, updateUser } = useAdminAuthStore();
  const [displayName, setDisplayName] = React.useState(user?.displayName || "Jyye yee");
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || "");
  const [previousUserId, setPreviousUserId] = React.useState(user?.id);
  const [isSaving, setIsSaving] = React.useState(false);

  if (user?.id !== previousUserId) {
    setPreviousUserId(user?.id);
    setDisplayName(user?.displayName || "Jyye yee");
    setAvatarUrl(user?.avatarUrl || "");
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSaving(true);

    try {
      await apiClient(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
        }),
      });

      updateUser({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });

      toast.success("Cập nhật thông tin định danh thành công");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể lưu thông tin";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = displayName
    ? displayName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "JY";

  return (
    <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <User className="size-4.5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-900">
            1. Thông Tin Định Danh Quản Trị
          </h3>
          <p className="text-[11px] text-slate-400">
            Hồ sơ hiển thị công khai trên biên bản giải quyết khiếu nại và nhật ký can thiệp.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Avatar Preview & Display Name */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-lg font-bold shadow-2xs">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar"
                className="size-full rounded-xl object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-medium text-slate-700">Tên Hiển Thị (Display Name)</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên hiển thị quản trị viên..."
              className="bg-white border-slate-200 text-xs text-slate-900 h-9"
              required
            />
          </div>
        </div>

        {/* Avatar URL Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Đường Dẫn Ảnh Đại Diện (Avatar URL)</label>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="bg-white border-slate-200 text-xs text-slate-800 h-9"
          />
        </div>

        {/* Work Email & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Mail className="size-3.5 text-slate-500" />
              Email Công Việc (Cảnh Báo Khẩn Cấp)
            </span>
            <div className="flex items-center h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-700">
              {user?.email || "Chưa thiết lập email"}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-slate-500" />
              Quyền Hạn RBAC &amp; Ngày Tham Gia
            </span>
            <div className="flex items-center justify-between h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono">
              <span className="rounded bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-semibold px-2 py-0.5">
                {user?.role || "ADMIN"}
              </span>
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Calendar className="size-3 text-slate-400" />
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "01/10/2026"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-9 px-4 gap-2 shadow-2xs"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            <span>Lưu Thông Tin Định Danh</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}

