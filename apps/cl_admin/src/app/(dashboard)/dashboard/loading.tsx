import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3 mb-5">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400">Command Center</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-semibold">Đang tải...</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="h-24 rounded-xl bg-slate-200/60" />
        <div className="h-24 rounded-xl bg-slate-200/60" />
        <div className="h-24 rounded-xl bg-slate-200/60" />
        <div className="h-24 rounded-xl bg-slate-200/60" />
      </div>
      <div className="h-16 rounded-xl bg-slate-200/60" />
      <div className="h-72 rounded-xl bg-slate-200/60" />
    </div>
  );
}

