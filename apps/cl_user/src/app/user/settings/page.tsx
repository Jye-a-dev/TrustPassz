"use client";

import * as React from "react";
import {
  Settings,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Building,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/auth-store";

export default function UserSettingsPage() {
  const { user } = useAuthStore();
  const [bankAccount, setBankAccount] = React.useState("0123456789");
  const [bankName, setBankName] = React.useState("MBBank (Quân Đội)");
  const [accountName, setAccountName] = React.useState("NGUYEN VAN A");
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Đã cập nhật STK VietQR nhận tiền bán thành công!");
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="size-6 text-cyan-400" />
          Cấu Hình Tài Khoản &amp; STK VietQR Nhận Tiền
        </h1>
        <p className="text-xs text-slate-400">
          Thiết lập số tài khoản ngân hàng nhận tiền bán tự động và phương thức bảo mật sinh trắc học.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VietQR Bank Linking Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <CreditCard className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                STK VietQR Nhận Tiền Bán
              </h2>
              <p className="text-[11px] text-slate-400">
                Tiền bán hàng sẽ tự động chuyển vào đây sau khi người mua kiểm tra xong.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBank} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                Ngân hàng thụ hưởng
              </label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs min-h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                Số tài khoản (STK)
              </label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs font-mono min-h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                Họ và tên chủ thẻ (viết hoa không dấu)
              </label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs uppercase min-h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full min-h-11 bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md mt-2"
            >
              <Save className="size-4 mr-1.5" />
              Lưu Thông Tin Ngân Hàng
            </Button>
          </form>
        </div>

        {/* Passkey & Web3 Wallet Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  Bảo Mật Sinh Trắc Học &amp; Tài Khoản An Toàn
                </h2>
                <p className="text-[11px] text-slate-400">
                  Xác thực sinh trắc học TouchID / FaceID bảo mật, không lo quên mật khẩu.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Khóa sinh trắc học hiện tại
                  </span>
                  <span className="font-bold text-slate-200">
                    TouchID / Windows Hello
                  </span>
                </div>
                <Badge className="bg-emerald-950 border-emerald-500/40 text-emerald-300 text-[10px]">
                  Đang hoạt động
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Mã tài khoản giao dịch bảo vệ tự động
                  </span>
                  <span className="font-mono text-cyan-400">
                    0x8B4f...3a29
                  </span>
                </div>
                <ShieldCheck className="size-4 text-cyan-400" />
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => toast.success("Khóa bảo mật dự phòng đã sẵn sàng!")}
            className="w-full min-h-11 border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold"
          >
            Thêm Thiết Bị Xác Thực Sinh Trắc Học Mới
          </Button>
        </div>
      </div>
    </div>
  );
}
