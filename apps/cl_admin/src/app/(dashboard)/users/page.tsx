"use client";

import * as React from "react";
import {
  Ban,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  UserCog,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { UserSearchTable } from "@/components/users/user-search-table";
import { apiClient } from "@/lib/api-client";
import { useAuditLogger } from "@/hooks/use-audit-logger";
import type { AdminUser, UserRole } from "@/types";
import { toast } from "sonner";

export default function UsersManagementPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [freezeFilter, setFreezeFilter] = React.useState<string>("ALL");

  const { logRoleChange, logWalletFreeze } = useAuditLogger();

  // 300ms Search Debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchUsers = React.useCallback(
    async (showToast = false) => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (roleFilter !== "ALL") params.role = roleFilter;
        if (freezeFilter === "FROZEN") params.isFrozen = "true";
        if (freezeFilter === "ACTIVE") params.isFrozen = "false";

        const response = await apiClient<{ data: AdminUser[]; meta: unknown }>(
          "/api/v1/admin/users",
          { params }
        );

        setUsers(response.data || []);
        if (showToast) {
          toast.success("Đã làm mới danh sách toàn bộ người dùng hệ thống");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi truy vấn người dùng";
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, roleFilter, freezeFilter]
  );

  React.useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = async (user: AdminUser, role: UserRole, reason: string) => {
    try {
      await apiClient(`/api/v1/admin/users/${user.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role, auditReason: reason }),
      });
      await logRoleChange(user.id, user.role, role, reason);
      toast.success(
        `Đã cập nhật vai trò của ${user.displayName || user.email} thành ${role}`
      );
      void fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật vai trò";
      toast.error(msg);
      throw err;
    }
  };

  const handleToggleFreeze = async (user: AdminUser, freeze: boolean, reason: string) => {
    try {
      await apiClient(`/api/v1/admin/users/${user.id}/freeze`, {
        method: "PATCH",
        body: JSON.stringify({ isFrozen: freeze, auditReason: reason }),
      });
      await logWalletFreeze(user.id, freeze, reason);
      toast.success(
        freeze
          ? `Đã đóng băng ví của ${user.displayName || user.email}`
          : `Đã mở khóa ví của ${user.displayName || user.email}`
      );
      void fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể thay đổi trạng thái ví";
      toast.error(msg);
      throw err;
    }
  };

  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;
  const arbitratorCount = users.filter((u) => u.role === "ARBITRATOR").length;
  const userCustomerCount = users.filter(
    (u) => u.role !== "ADMIN" && u.role !== "SUPER_ADMIN" && u.role !== "ARBITRATOR"
  ).length;
  const web3Count = users.filter((u) => u.walletAddress).length;
  const frozenCount = users.filter((u) => u.isFrozen).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-text-muted hover:text-text-primary transition-colors">Hạ Tầng</span>
          <span className="text-border-strong">/</span>
          <span className="text-text-primary font-semibold">Người Dùng &amp; RBAC</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers(true)}
          disabled={isLoading}
          className="border-border-subtle bg-surface hover:bg-muted text-text-primary text-xs h-8.5 gap-1.5 shadow-2xs font-medium self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-text-primary" : "text-text-muted"}`} />
          <span>Làm Mới</span>
        </Button>
      </div>

      <div>
        <h2 className="text-base font-bold text-text-primary">
          Quản Trị Toàn Bộ Người Dùng (Bao Gồm Cả Quản Trị Viên)
        </h2>
        <p className="text-xs text-text-muted">
          Hiển thị 100% hồ sơ người dùng thực tế: Quản trị viên, Trọng tài viên và Khách hàng ký quỹ.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Toàn Bộ Người Dùng</span>
            <Users className="h-4 w-4 text-text-muted" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-text-primary tabular-nums">
            {totalCount}
          </div>
          <p className="text-[10px] text-text-muted mt-1 font-mono">
            {adminCount} Admin • {arbitratorCount} Trọng tài • {userCustomerCount} User
          </p>
        </Card>

        <Card className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Ví Web3 Đã Liên Kết</span>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {web3Count}
          </div>
          <p className="text-[10px] text-text-muted mt-1 font-mono">Solana &amp; Base Sepolia</p>
        </Card>

        <Card className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Đội Ngũ Quản Trị / Trọng Tài</span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
            {adminCount + arbitratorCount}
          </div>
          <p className="text-[10px] text-text-muted mt-1 font-mono">Quyền RBAC đặc quyền</p>
        </Card>

        <Card className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Ví Đang Đóng Băng</span>
            <Ban className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {frozenCount}
          </div>
          <p className="text-[10px] text-text-muted mt-1 font-mono">Tạm khóa can thiệp bảo mật</p>
        </Card>
      </div>

      {/* Filters & Debounced Search Toolbar */}
      <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo UUID, Email, ví Base58 Solana hoặc 0x..."
            className="pl-9 bg-muted/40 border-border-subtle text-xs min-h-[40px] text-text-primary placeholder:text-text-muted focus:bg-surface"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-text-muted" />
            <span className="text-xs text-text-muted font-medium">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Lọc theo vai trò người dùng"
              className="h-9 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs text-text-primary font-mono cursor-pointer focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              <option value="ALL">Tất cả vai trò (100%)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Tối cao)</option>
              <option value="ADMIN">ADMIN (Quản trị viên)</option>
              <option value="ARBITRATOR">ARBITRATOR (Trọng tài viên)</option>
              <option value="USER">USER (Khách hàng)</option>
            </select>
          </div>

          {/* Freeze Filter */}
          <div className="inline-flex rounded-lg border border-border-subtle bg-muted/40 p-1">
            {[
              { id: "ALL", label: "Tất cả ví" },
              { id: "ACTIVE", label: "Bình thường" },
              { id: "FROZEN", label: "Đã khóa" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFreezeFilter(f.id)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                  freezeFilter === f.id
                    ? "bg-surface text-text-primary font-semibold shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <UserSearchTable
        users={users}
        isLoading={isLoading}
        onRefresh={() => fetchUsers(true)}
        onUpdateRole={handleUpdateRole}
        onToggleFreeze={handleToggleFreeze}
      />
    </div>
  );
}
