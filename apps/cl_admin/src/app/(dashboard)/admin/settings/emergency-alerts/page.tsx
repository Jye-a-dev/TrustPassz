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
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400">
              <ShieldAlert className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              Quản trị Kênh Cảnh báo Khẩn cấp & Dispatch Mail
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>TASK-c-4</span>
            <span>&bull;</span>
            <Badge variant="cyan">Giai đoạn 5 / V_0.0.4 - Alpha</Badge>
            <span>&bull;</span>
            <Badge variant="emerald">SLA &lt; 2s Dispatch</Badge>
            <span>&bull;</span>
            <Badge variant="destructive">2FA Super Admin Guard</Badge>
          </div>
        </div>

        {/* Action Button: Instant Test Send */}
        <div className="flex items-center gap-3">
          <TestSendButton onSuccess={handleRefreshAll} />
        </div>
      </div>

      {/* KPI / System Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="bg-[#0F172A] border-[#1E293B] p-4 text-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Kênh Vận Chuyển</span>
            <Server className="size-4 text-cyan-400" />
          </div>
          <div className="text-base font-bold font-mono text-cyan-400">
            Google Workspace SMTP
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Pool: 5 conns &bull; Port 465 SSL &bull; Nodemailer
          </p>
        </Card>

        {/* Metric 2 */}
        <Card className="bg-[#0F172A] border-[#1E293B] p-4 text-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Cam Kết SLA</span>
            <Zap className="size-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-400">
            &lt; 2000 ms Response
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Non-blocking fail-safe timeout guard
          </p>
        </Card>

        {/* Metric 3 */}
        <Card className="bg-[#0F172A] border-[#1E293B] p-4 text-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Hàng Rào Bảo Mật</span>
            <Lock className="size-4 text-amber-400" />
          </div>
          <div className="text-base font-bold font-mono text-amber-400">
            2FA PIN (6 Digits)
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Yêu cầu SUPER_ADMIN + Mã PIN cấp 2
          </p>
        </Card>

        {/* Metric 4 */}
        <Card className="bg-[#0F172A] border-[#1E293B] p-4 text-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">Chống Spam Flooding</span>
            <BellRing className="size-4 text-rose-400" />
          </div>
          <div className="text-base font-bold font-mono text-rose-400">
            300s Debounce TTL
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Fingerprint SHA-256 khóa trùng lặp
          </p>
        </Card>
      </div>

      {/* Tabs View */}
      <Tabs defaultValue="recipients" className="space-y-5">
        <TabsList className="bg-[#0F172A] border border-[#1E293B] p-1 h-auto flex flex-wrap gap-1">
          <TabsTrigger
            value="recipients"
            className="min-h-[44px] px-4 font-mono text-xs data-[state=active]:bg-cyan-950/80 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-800/80 cursor-pointer"
          >
            <Mail className="size-3.5 mr-2" />
            Danh Sách Email Cứu Hộ (Mailing List)
          </TabsTrigger>
          <TabsTrigger
            value="audit-logs"
            className="min-h-[44px] px-4 font-mono text-xs data-[state=active]:bg-cyan-950/80 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-800/80 cursor-pointer"
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

