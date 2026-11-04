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
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl);
  }, [user]);

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
    <Card className="border-slate-800 bg-[#0F172A] p-5 shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="flex size-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
          <User className="size-5" />
        </div>
        <div>
          <h3 className="font-mono text-sm font-semibold text-white">
            1. Thông Tin Định Danh Quản Trị
          </h3>
          <p className="text-xs text-slate-400">
            Hồ sơ hiển thị công khai trên biên bản giải quyết khiếu nại và nhật ký can thiệp.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Avatar Preview & Display Name */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-900/50">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-cyan-950 text-cyan-300 font-mono text-xl font-bold shadow-lg shadow-cyan-950/50">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar"
                className="size-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-mono text-slate-400">Tên Hiển Thị (Display Name)</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên hiển thị quản trị viên..."
              className="bg-slate-950 border-slate-800 text-xs text-white min-h-[44px]"
              required
            />
          </div>
        </div>

        {/* Avatar URL Input */}
        <div className="space-y-1">
          <label className="text-xs font-mono text-slate-400">Đường Dẫn Ảnh Đại Diện (Avatar URL)</label>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="bg-slate-900 border-slate-800 text-xs text-slate-200 min-h-[44px]"
          />
        </div>

        {/* Work Email & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Mail className="size-3.5 text-cyan-400" />
              Email Công Việc (Cảnh Báo Khẩn Cấp)
            </span>
            <div className="flex items-center h-11 px-3 rounded-md border border-slate-800 bg-slate-950 text-xs font-mono text-slate-300">
              {user?.email || "admin@trustpassz.io"}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              Quyền Hạn RBAC & Ngày Tham Gia
            </span>
            <div className="flex items-center justify-between h-11 px-3 rounded-md border border-slate-800 bg-slate-950 text-xs font-mono">
              <Badge className="bg-cyan-950/60 text-cyan-400 border-cyan-800 text-[10px]">
                {user?.role || "ADMIN"}
              </Badge>
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Calendar className="size-3" />
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "01/10/2026"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs min-h-[44px] px-5 gap-2"
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

