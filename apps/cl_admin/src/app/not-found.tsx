import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4 p-6">
      <div className="text-6xl font-bold font-mono text-slate-300 tracking-wider">404</div>
      <h2 className="text-lg font-bold text-slate-900">Không Tìm Thấy Trang Yêu Cầu</h2>
      <p className="text-xs text-slate-500 max-w-sm">
        Đường dẫn bạn yêu cầu không tồn tại hoặc phiên làm việc đã bị thu hồi quyền hạn.
      </p>
      <Button asChild className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs">
        <Link href="/dashboard">
          Về Trang Tổng Quan
        </Link>
      </Button>
    </div>
  );
}
