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
    <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Bell className="size-4.5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-900">
            3. Kênh Thông Báo Cảnh Báo Khẩn Cấp
          </h3>
          <p className="text-[11px] text-slate-400">
            Cấu hình nhận cảnh báo khi số dư ví Gas Relayer chạm ngưỡng nguy cấp (&lt; 0.02 ETH hoặc &lt; 0.1 SOL).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Send className="size-3.5 text-slate-500" />
              Telegram Chat ID / Username
            </label>
            <Input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="@username hoặc Chat ID..."
              className="bg-white border-slate-200 text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="size-3.5 text-slate-500" />
              Discord Alert Webhook URL
            </label>
            <Input
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="bg-white border-slate-200 text-xs h-9"
            />
          </div>
        </div>

        {/* Checkbox Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={alertLowGas}
              onChange={(e) => setAlertLowGas(e.target.checked)}
              className="size-4 accent-slate-900 rounded"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900">Cảnh báo cạn Gas Relayer</span>
              <span className="text-[10px] text-slate-500 font-mono">ETH &lt; 0.02, SOL &lt; 0.1</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={alertDisputes}
              onChange={(e) => setAlertDisputes(e.target.checked)}
              className="size-4 accent-slate-900 rounded"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900">Khiếu nại leo thang khẩn cấp</span>
              <span className="text-[10px] text-slate-500 font-mono">AI Escalation sang Admin</span>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-9 px-4 shadow-2xs"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Lưu Cấu Hình Thông Báo"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

