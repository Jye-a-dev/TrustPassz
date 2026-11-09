"use client";

import * as React from "react";
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Check,
  Loader2,
  Sparkles,
  Upload,
  Phone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAuthStore } from "@/lib/admin-auth-store";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const CUTE_AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=CyberSentinel",
  "https://api.dicebear.com/7.x/bottts/svg?seed=QuantumFox",
  "https://api.dicebear.com/7.x/bottts/svg?seed=EscrowPanda",
  "https://api.dicebear.com/7.x/bottts/svg?seed=AegisCat",
  "https://api.dicebear.com/7.x/bottts/svg?seed=CryptoOwl",
];

export function ProfileIdentityCard() {
  const { user, updateUser } = useAdminAuthStore();
  const [displayName, setDisplayName] = React.useState(user?.displayName || "Admin User");
  const [email, setEmail] = React.useState(user?.email || "");
  const [phone, setPhone] = React.useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || "");
  const [previousUserId, setPreviousUserId] = React.useState(user?.id);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSavingAvatarOnly, setIsSavingAvatarOnly] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (user?.id !== previousUserId) {
    setPreviousUserId(user?.id);
    setDisplayName(user?.displayName || "Admin User");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setAvatarUrl(user?.avatarUrl || "");
  }

  const handleRandomCuteAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const styles = ["bottts", "adventurer", "lorelei"];
    const style = styles[Math.floor(Math.random() * styles.length)];
    const newAvatar = `https://api.dicebear.com/7.x/${style}/svg?seed=${randomSeed}`;
    setAvatarUrl(newAvatar);
    toast.success("Đã tạo mẫu Avatar Cute ngẫu nhiên! Nhấp 'Lưu Avatar' để hoàn tất.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn định dạng file ảnh (PNG, JPG, SVG, WebP)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        toast.success("Đã nạp ảnh đại diện mới. Nhấp 'Lưu Avatar' để đồng bộ.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatarOnly = async () => {
    if (!user?.id) return;
    setIsSavingAvatarOnly(true);
    try {
      await apiClient(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          avatarUrl: avatarUrl.trim() || undefined,
        }),
      });

      updateUser({
        avatarUrl: avatarUrl.trim() || null,
      });

      toast.success("Đã lưu và đồng bộ Avatar mới lên Navbar");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể lưu avatar";
      toast.error(msg);
    } finally {
      setIsSavingAvatarOnly(false);
    }
  };

  const handleSaveFullProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSaving(true);

    try {
      await apiClient(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        }),
      });

      updateUser({
        displayName: displayName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || null,
      });

      toast.success("Cập nhật thông tin định danh & avatar thành công");
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
    : "AD";

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <Card className="rounded-xl border border-border-subtle bg-surface p-6 shadow-xs space-y-6">
      <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-text-primary">
          <User className="size-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary">
            1. Thông Tin Định Danh &amp; Ảnh Đại Diện Quản Trị
          </h3>
          <p className="text-xs text-text-muted">
            Hồ sơ hiển thị trên biên bản khiếu nại, thanh điều hướng Topbar và kênh cảnh báo khẩn cấp.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveFullProfile} className="space-y-6">
        {/* Module Avatar */}
        <div className="space-y-3 p-4 rounded-xl border border-border-subtle bg-muted/30">
          <label className="text-xs font-semibold text-text-primary block">
            Ảnh Đại Diện Quản Trị Viên (Avatar Module)
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Live Avatar Preview */}
            <div className="relative group flex size-20 shrink-0 items-center justify-center rounded-2xl bg-text-primary text-text-inverse font-mono text-2xl font-bold shadow-md overflow-hidden border-2 border-border-strong">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Avatar Action Controls */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRandomCuteAvatar}
                  className="gap-1.5 border-border-subtle bg-surface text-text-primary hover:bg-muted text-xs h-9"
                >
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>Random Cute Avatar</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 border-border-subtle bg-surface text-text-primary hover:bg-muted text-xs h-9"
                >
                  <Upload className="size-3.5 text-cyan-500" />
                  <span>Tải ảnh lên</span>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveAvatarOnly}
                  disabled={isSavingAvatarOnly}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 ml-auto"
                >
                  {isSavingAvatarOnly ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  <span>Lưu Avatar</span>
                </Button>
              </div>

              {/* Cute Presets Selection */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-text-muted font-mono">Cute Presets:</span>
                <div className="flex items-center gap-1.5">
                  {CUTE_AVATAR_PRESETS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(presetUrl);
                        toast.info("Đã chọn Avatar Preset");
                      }}
                      className="size-7 rounded-lg overflow-hidden border border-border-subtle hover:border-cyan-500 transition-all cursor-pointer p-0.5 bg-surface"
                      title={`Cute Avatar #${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={presetUrl} alt="Preset" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields: Display Name & Emergency Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-primary flex items-center gap-1.5">
              <User className="size-3.5 text-text-muted" />
              Tên Hiển Thị (Display Name)
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên hiển thị quản trị viên..."
              className="bg-surface border-border-subtle text-xs text-text-primary h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-primary flex items-center gap-1.5">
              <Mail className="size-3.5 text-text-muted" />
              Email Công Việc (Nhận Cảnh Báo Khẩn Cấp)
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourdomain.com"
              className="bg-surface border-border-subtle text-xs text-text-primary h-9 font-mono"
              required
            />
          </div>
        </div>

        {/* Role Badge & Phone/Telegram ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-primary flex items-center gap-1.5">
              <Phone className="size-3.5 text-text-muted" />
              Số Điện Thoại / Telegram ID Nhận Cảnh Báo
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+84 987 654 321 hoặc @telegram_admin"
              className="bg-surface border-border-subtle text-xs text-text-primary h-9 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-text-muted" />
              Vai Trò Quản Trị (RBAC Authority)
            </span>
            <div className="flex items-center justify-between h-9 px-3 rounded-lg border border-border-subtle bg-muted/40 text-xs font-mono">
              <Badge
                variant="outline"
                className={
                  isSuperAdmin
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/30 text-[10px] font-semibold"
                    : "bg-indigo-500/10 text-indigo-500 border-indigo-500/30 text-[10px] font-semibold"
                }
              >
                {user?.role || "ADMIN"}
              </Badge>
              <span className="text-text-muted text-[11px] flex items-center gap-1">
                <Calendar className="size-3 text-text-muted" />
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : "01/10/2026"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border-subtle">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-text-primary text-text-inverse hover:opacity-90 font-medium text-xs h-9 px-5 gap-2 shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            <span>Lưu Toàn Bộ Hồ Sơ Quản Trị</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
