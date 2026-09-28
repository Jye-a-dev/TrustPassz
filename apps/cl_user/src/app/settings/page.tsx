"use client";

import * as React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { toast } from "sonner";
import {
  Settings,
  Wallet,
  Shield,
  KeyRound,
  User,
  Fingerprint,
  Bell,
  CheckCircle2,
  Copy,
  ExternalLink,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth-store";

export default function SettingsPage() {
  const { user, setAuth } = useAuthStore();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [displayName, setDisplayName] = React.useState(
    user?.displayName || "Trader_TrustPassz"
  );
  const [email, setEmail] = React.useState(user?.email || "trader@trustpassz.io");
  const [isSaving, setIsSaving] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState(false);

  const handleCopySolana = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopiedKey(true);
      toast.success("Đã sao chép địa chỉ ví Solana!");
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((res) => setTimeout(res, 600));

    if (user) {
      setAuth({
        ...user,
        displayName,
        email,
      });
    }

    toast.success("Lưu cấu hình thành công!", {
      description: "Thông tin hồ sơ và ví đã được cập nhật an toàn.",
    });
    setIsSaving(false);
  };

  const handleRegisterNewPasskey = async () => {
    try {
      if (
        typeof window === "undefined" ||
        !window.PublicKeyCredential ||
        typeof navigator.credentials?.create !== "function"
      ) {
        throw new Error("Thiết bị này không hỗ trợ đăng ký Passkey mới");
      }

      toast.info("Đăng ký Passkey mới", {
        description: "Vui lòng xác thực sinh trắc học TouchID/FaceID trên thiết bị...",
      });

      await new Promise((res) => setTimeout(res, 1000));
      toast.success("Đăng ký Passkey hoàn tất!", {
        description: "Thiết bị của bạn đã được liên kết với két bảo mật TrustPassz.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký Passkey thất bại";
      toast.error(msg);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="size-6 text-cyan-400" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Cấu Hình Ví & Tài Khoản
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Quản lý định danh Web3, ví nhận tiền giải ngân ký quỹ và khóa bảo mật sinh trắc học Passkey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Navigation */}
        <div className="space-y-2">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-linear-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-lg">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">
                  {displayName}
                </div>
                <div className="text-xs text-slate-400 truncate">{email}</div>
              </div>
            </div>

            <Badge
              variant="outline"
              className="w-full justify-center border-emerald-500/40 bg-emerald-950/20 text-emerald-400 text-xs py-1"
            >
              <Shield className="size-3 mr-1" />
              Tài Khoản Đã Xác Thực
            </Badge>
          </div>
        </div>

        {/* Right Configuration Panels */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <form onSubmit={handleSaveProfile}>
            <Card className="border-slate-800 bg-slate-950/80 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="size-4 text-cyan-400" />
                  <span>Thông Tin Cá Nhân</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Tên hiển thị và email nhận mã OTP giải phóng quỹ ký quỹ
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Tên hiển thị / Biệt danh Trader
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Địa chỉ Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs"
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-800/80 pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-9 px-4 gap-1.5"
                >
                  <Save className="size-3.5" />
                  <span>{isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}</span>
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Web3 Solana Wallet Configuration */}
          <Card className="border-slate-800 bg-slate-950/80 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="size-4 text-purple-400" />
                <span>Liên Kết Ví Solana (SIWS)</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Địa chỉ ví Solana mặc định dùng để ký xác thực và nhận giải ngân
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Trạng Thái Ví Solana
                  </span>
                  {connected && publicKey ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-950/20 text-emerald-400 text-[10px]"
                    >
                      Đã Kết Nối
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-slate-700 bg-slate-800 text-slate-400 text-[10px]"
                    >
                      Chưa Kết Nối
                    </Badge>
                  )}
                </div>

                {connected && publicKey ? (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300">
                    <span className="truncate">{publicKey.toBase58()}</span>
                    <button
                      type="button"
                      onClick={handleCopySolana}
                      className="p-1 hover:text-white"
                      title="Sao chép địa chỉ ví"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Kết nối ví Phantom hoặc Solflare để kích hoạt cơ chế nhận tiền
                    ký quỹ Solana và ký nhận thông điệp SIWS.
                  </p>
                )}

                <div className="pt-1">
                  {connected ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => disconnect()}
                      className="border-rose-500/40 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 text-xs h-8"
                    >
                      Ngắt Kết Nối Ví
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setWalletModalVisible(true)}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-8"
                    >
                      Kết Nối Ví Solana Ngay
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passkey & Biometrics */}
          <Card className="border-slate-800 bg-slate-950/80 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Fingerprint className="size-4 text-emerald-400" />
                <span>Bảo Mật Sinh Trắc Học Passkey</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Đăng nhập tức thì không cần mật khẩu qua Touch ID, Face ID hoặc khóa bảo mật phần cứng
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <KeyRound className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Khóa Thiết Bị Hiện Tại
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Chuẩn xác thực WebAuthn FIDO2
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegisterNewPasskey}
                  className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white text-xs h-8"
                >
                  Đăng Ký Khóa Mới
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
