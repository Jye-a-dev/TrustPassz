"use client";

import * as React from "react";
import { User as UserIcon, RefreshCw, Upload, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth-store";
import { getSmartAvatarUrl, generateRandomSeed } from "@/lib/avatar-helper";

export function ProfileSettingsCard() {
  const { user, updateUser } = useAuthStore();

  const [displayName, setDisplayName] = React.useState(user?.displayName || "Trần Quốc Toản");
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || "");
  const [avatarSeed, setAvatarSeed] = React.useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl);
  }, [user]);

  const currentAvatarPreview = React.useMemo(() => {
    if (avatarUrl) return avatarUrl;
    return getSmartAvatarUrl(user, avatarSeed);
  }, [avatarUrl, user, avatarSeed]);

  const handleRandomizeAvatar = () => {
    const seed = generateRandomSeed();
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    setAvatarSeed(seed);
    setAvatarUrl(newAvatar);
    toast.info("Đã tạo mẫu avatar hoạt hình ngẫu nhiên mới!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dung lượng ảnh tối đa là 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
        setAvatarSeed("");
        toast.success("Đã tải ảnh đại diện lên thành công!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    setTimeout(() => {
      updateUser({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl || currentAvatarPreview,
      });
      setIsSavingProfile(false);
      toast.success("Đã cập nhật thông tin cá nhân và ảnh đại diện thành công!");
    }, 400);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 shadow-sm">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900 shrink-0">
          <UserIcon className="size-5" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Hồ Sơ &amp; Ảnh Đại Diện
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tùy chỉnh tên hiển thị và avatar ngẫu nhiên hoặc ảnh từ máy tính.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentAvatarPreview}
              alt="Avatar preview"
              className="size-20 rounded-2xl object-cover border-2 border-rose-500/40 shadow-sm bg-white dark:bg-slate-800"
            />
            <span className="absolute -bottom-1 -right-1 size-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
          </div>

          <div className="flex flex-col gap-2 w-full text-center sm:text-left">
            <span className="font-bold text-slate-900 dark:text-white text-xs">
              Ảnh đại diện TrustPassz
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Tự động đồng bộ từ Google OAuth hoặc tạo icon vui nhộn qua DiceBear Bottts.
            </span>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRandomizeAvatar}
                className="min-h-11 sm:min-h-9 px-3 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-900 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>Đổi icon ngẫu nhiên</span>
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-11 sm:min-h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="size-3.5" />
                <span>Tải ảnh lên</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-800 dark:text-slate-200 font-bold block font-mono text-xs uppercase">
            Tên hiển thị (Display Name) <span className="text-rose-600">*</span>
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            className="w-full min-h-11 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isSavingProfile}
          className="w-full min-h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-950"
        >
          <Save className="size-4" />
          <span>{isSavingProfile ? "Đang lưu..." : "Lưu Thông Tin Cá Nhân"}</span>
        </Button>
      </form>
    </div>
  );
}
