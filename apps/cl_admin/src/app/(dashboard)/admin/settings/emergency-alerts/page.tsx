"use client";

import * as React from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Lock,
  Mail,
  Server,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmergencyEmailTable } from "@/components/emergency/emergency-email-table";
import { EmergencyAuditLogTable } from "@/components/emergency/emergency-audit-log-table";
import { TestSendButton } from "@/components/emergency/test-send-button";

export default function EmergencyAlertsPage() {
  const [refreshTrigger, setRefreshTrigger] = React.useState<number>(0);

  const handleRefreshAll = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto overflow-x-hidden">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 hover:text-slate-800 transition-colors">Hạ Tầng</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">Cảnh Báo Khẩn Cấp</span>
        </div>

        {/* Action Button: Instant Test Send */}
        <div className="flex items-center gap-3">
          <TestSendButton onSuccess={handleRefreshAll} />
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">Kênh Cảnh Báo Khẩn Cấp Google Workspace SMTP</h2>
        <p className="text-xs text-slate-500">Hạ tầng cảnh báo on-call cứu hộ sự cố, SLA phát thư &lt; 120 giây.</p>
      </div>

      {/* Overview Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-0.5 text-xs">
          <p className="text-slate-900 font-semibold">SMTP: smtp.gmail.com:587 (TLS Enabled)</p>
          <p className="text-slate-500 font-mono text-[11px]">Sender: ops-alerts@trustpassz.io</p>
        </div>
        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 font-semibold font-mono">
          ONLINE
        </span>
      </div>

      {/* KPI / System Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Kênh Vận Chuyển</span>
            <Server className="size-4 text-slate-400" />
          </div>
          <div className="text-sm font-bold font-mono text-slate-900">
            Google Workspace SMTP
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Pool: 5 conns &bull; Port 465 SSL &bull; Nodemailer
          </p>
        </Card>

        {/* Metric 2 */}
        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Cam Kết SLA</span>
            <Zap className="size-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold font-mono text-emerald-700">
            &lt; 2000 ms Response
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Non-blocking fail-safe timeout guard
          </p>
        </Card>

        {/* Metric 3 */}
        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Hàng Rào Bảo Mật</span>
            <Lock className="size-4 text-amber-600" />
          </div>
          <div className="text-sm font-bold font-mono text-amber-700">
            2FA PIN (6 Digits)
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Yêu cầu SUPER_ADMIN + Mã PIN cấp 2
          </p>
        </Card>

        {/* Metric 4 */}
        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Chống Spam Flooding</span>
            <BellRing className="size-4 text-rose-600" />
          </div>
          <div className="text-sm font-bold font-mono text-rose-700">
            300s Debounce TTL
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Fingerprint SHA-256 khóa trùng lặp
          </p>
        </Card>
      </div>

      {/* Tabs View */}
      <Tabs defaultValue="recipients" className="space-y-5">
        <TabsList className="bg-slate-100 border border-slate-200 p-1 h-auto flex flex-wrap gap-1">
          <TabsTrigger
            value="recipients"
            className="h-9 px-4 font-mono text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs cursor-pointer font-medium"
          >
            <Mail className="size-3.5 mr-2" />
            Danh Sách Email Cứu Hộ (Mailing List)
          </TabsTrigger>
          <TabsTrigger
            value="audit-logs"
            className="h-9 px-4 font-mono text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs cursor-pointer font-medium"
          >
            <ShieldAlert className="size-3.5 mr-2" />
            Nhật Ký Dispatch Mail (Audit Logs)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recipients" className="mt-4 focus-visible:outline-none">
          <EmergencyEmailTable onListChanged={handleRefreshAll} />
        </TabsContent>

        <TabsContent value="audit-logs" className="mt-4 focus-visible:outline-none">
          <EmergencyAuditLogTable refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

