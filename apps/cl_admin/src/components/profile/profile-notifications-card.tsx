"use client";

import * as React from "react";
import { Bell, Send, CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function ProfileNotificationsCard() {
  const [telegramId, setTelegramId] = React.useState("@jyye_admin");
  const [discordWebhook, setDiscordWebhook] = React.useState("");
  const [alertLowGas, setAlertLowGas] = React.useState(true);
  const [alertDisputes, setAlertDisputes] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem("tpz_admin_telegram_id", telegramId);
      localStorage.setItem("tpz_admin_discord_webhook", discordWebhook);
      toast.success("Đã cập nhật kênh nhận thông báo cảnh báo khẩn cấp");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-[#0F172A] p-5 shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="flex size-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/40 text-amber-400">
          <Bell className="size-5" />
        </div>
        <div>
          <h3 className="font-mono text-sm font-semibold text-white">
            3. Kênh Thông Báo Cảnh Báo Khẩn Cấp
          </h3>
          <p className="text-xs text-slate-400">
            Cấu hình nhận cảnh báo khi số dư ví Gas Relayer chạm ngưỡng nguy cấp (&lt; 0.02 ETH hoặc &lt; 0.1 SOL).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Send className="size-3.5 text-cyan-400" />
              Telegram Chat ID / Username
            </label>
            <Input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="@username hoặc Chat ID..."
              className="bg-slate-900 border-slate-800 text-xs min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="size-3.5 text-indigo-400" />
              Discord Alert Webhook URL
            </label>
            <Input
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="bg-slate-900 border-slate-800 text-xs min-h-[44px]"
            />
          </div>
        </div>

        {/* Checkbox Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={alertLowGas}
              onChange={(e) => setAlertLowGas(e.target.checked)}
              className="size-4 accent-cyan-500 rounded"
            />
            <div className="flex flex-col">
              <span className="text-xs font-mono text-white">Cảnh báo cạn Gas Relayer</span>
              <span className="text-[10px] text-slate-400">ETH &lt; 0.02, SOL &lt; 0.1</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={alertDisputes}
              onChange={(e) => setAlertDisputes(e.target.checked)}
              className="size-4 accent-cyan-500 rounded"
            />
            <div className="flex flex-col">
              <span className="text-xs font-mono text-white">Khiếu nại leo thang khẩn cấp</span>
              <span className="text-[10px] text-slate-400">AI Escalation sang Admin</span>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs min-h-[44px] px-5"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Lưu Cấu Hình Thông Báo"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

