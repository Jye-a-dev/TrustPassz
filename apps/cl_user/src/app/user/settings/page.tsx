"use client";

import * as React from "react";
import {
  Settings,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UserSettingsPage() {
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
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 sm:pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
              <Settings className="size-6" />
            </div>
            <span>Cấu Hình Tài Khoản &amp; STK VietQR Nhận Tiền</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết lập số tài khoản ngân hàng nhận tiền bán tự động và các phương thức bảo mật sinh trắc học Passkey.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* VietQR Bank Linking Card */}
        <div className="lg:col-span-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
              <CreditCard className="size-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                STK Ngân Hàng Nhận Tiền Giải Ngân
              </h2>
              <p className="text-xs text-slate-500">
                Tiền bán sẽ tự động chuyển về đây ngay khi người mua hoàn tất kiểm tra hàng.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBank} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold block font-mono text-xs uppercase">
                Ngân hàng thụ hưởng <span className="text-rose-600">*</span>
              </label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold block font-mono text-xs uppercase">
                Số tài khoản (STK) <span className="text-rose-600">*</span>
              </label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full min-h-11 px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-800 font-bold block font-mono text-xs uppercase">
                Họ và tên chủ thẻ (in hoa không dấu) <span className="text-rose-600">*</span>
              </label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full min-h-11 px-4 py-2.5 rounded-xl border border-slate-300 bg-white uppercase text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs"
              />
            </div>

            <div className="p-4 sm:p-5 my-3 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Tự động tất toán về tài khoản</span>
                <span className="text-[11px] text-slate-500">Tiền chuyển thẳng về STK VietQR, không cần rút thủ công</span>
              </div>
              <div className="w-12 h-7 rounded-full bg-emerald-600 p-0.5 flex items-center justify-end cursor-pointer shadow-xs shrink-0">
                <div className="size-6 rounded-full bg-white shadow-md"></div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full min-h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-md mt-6 flex items-center justify-center gap-2 transition-all border border-rose-600 cursor-pointer"
            >
              <Save className="size-4 mr-1.5" />
              <span>{isSaving ? "Đang lưu..." : "Lưu STK Nhận Tiền"}</span>
            </Button>
          </form>
        </div>

        {/* Passkey & Security Card */}
        <div className="lg:col-span-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Bảo Mật Sinh Trắc Học &amp; Ví
                </h2>
                <p className="text-xs text-slate-500">
                  Xác thực TouchID / FaceID bảo mật cao, không lo quên mật khẩu.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">
                    Khóa sinh trắc học hiện tại
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    TouchID / Windows Hello
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                  Đang hoạt động
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">
                    Mã định danh an toàn trên sàn
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    0x8B4f...3a29
                  </span>
                </div>
                <ShieldCheck className="size-4 text-emerald-600" />
              </div>

              <div className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Thông báo biến động két qua tin nhắn</span>
                  <span className="text-[11px] text-slate-500">Nhận thông báo khi có người nạp cọc hoặc yêu cầu bàn giao</span>
                </div>
                <div className="w-12 h-7 rounded-full bg-rose-500 p-0.5 flex items-center justify-end cursor-pointer shadow-xs shrink-0">
                  <div className="size-6 rounded-full bg-white shadow-md"></div>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => toast.success("Khóa bảo mật sinh trắc học đã sẵn sàng!")}
            className="w-full min-h-12 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 mt-4 shadow-2xs transition-colors cursor-pointer"
          >
            <KeyRound className="size-4 text-slate-700" />
            <span>Thêm Thiết Bị Xác Thực Sinh Trắc Học Mới</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
