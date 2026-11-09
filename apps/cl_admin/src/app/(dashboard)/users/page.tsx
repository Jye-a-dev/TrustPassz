'use client';

import * as React from 'react';
import {
  Ban,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { UserSearchTable } from '@/components/users/user-search-table';
import { apiClient } from '@/lib/api-client';
import { useAuditLogger } from '@/hooks/use-audit-logger';
import type { AdminUser, UserRole } from '@/types';
import { toast } from 'sonner';

export default function UsersManagementPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'CUSTOMERS' | 'STAFF'>('CUSTOMERS');
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');
  const [freezeFilter, setFreezeFilter] = React.useState<string>('ALL');

  const { logRoleChange, logWalletFreeze } = useAuditLogger();

  // 300ms Search Debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchUsers = React.useCallback(async (showToast = false) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        type: activeTab,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (freezeFilter === 'FROZEN') params.isFrozen = 'true';
      if (freezeFilter === 'ACTIVE') params.isFrozen = 'false';

      const response = await apiClient<{ data: AdminUser[]; meta: unknown }>(
        '/api/v1/admin/users',
        { params },
      );

      setUsers(response.data || []);
      if (showToast) {
        toast.success(
          activeTab === 'CUSTOMERS'
            ? 'Đã làm mới danh sách khách hàng'
            : 'Đã làm mới danh sách đội ngũ quản trị'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi truy vấn người dùng';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, debouncedSearch, roleFilter, freezeFilter]);

  React.useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {
          type: activeTab,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (roleFilter !== 'ALL') params.role = roleFilter;
        if (freezeFilter === 'FROZEN') params.isFrozen = 'true';
        if (freezeFilter === 'ACTIVE') params.isFrozen = 'false';

        const response = await apiClient<{ data: AdminUser[]; meta: unknown }>(
          '/api/v1/admin/users',
          { params },
        );

        setUsers(response.data || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi truy vấn người dùng';
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [activeTab, debouncedSearch, roleFilter, freezeFilter]);

  const handleTabChange = (tab: 'CUSTOMERS' | 'STAFF') => {
    setActiveTab(tab);
    setRoleFilter('ALL');
  };

  const handleUpdateRole = async (user: AdminUser, role: UserRole, reason: string) => {
    try {
      await apiClient(`/api/v1/admin/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role, auditReason: reason }),
      });
      await logRoleChange(user.id, user.role, role, reason);
      toast.success(`Đã cập nhật vai trò của ${user.displayName || user.email} thành ${role}`);
      void fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật vai trò';
      toast.error(msg);
      throw err;
    }
  };

  const handleToggleFreeze = async (user: AdminUser, freeze: boolean, reason: string) => {
    try {
      await apiClient(`/api/v1/admin/users/${user.id}/freeze`, {
        method: 'PATCH',
        body: JSON.stringify({ isFrozen: freeze, auditReason: reason }),
      });
      await logWalletFreeze(user.id, freeze, reason);
      toast.success(
        freeze
          ? `Đã đóng băng ví của ${user.displayName || user.email}`
          : `Đã mở khóa ví của ${user.displayName || user.email}`,
      );
      void fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể thay đổi trạng thái ví';
      toast.error(msg);
      throw err;
    }
  };

  const totalCount = users.length;
  const frozenCount = users.filter((u) => u.isFrozen).length;
  const arbitratorCount = users.filter((u) => u.role === 'ARBITRATOR').length;
  const web3Count = users.filter((u) => u.walletAddress).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 hover:text-slate-800 transition-colors">Hạ Tầng</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">Người Dùng &amp; RBAC</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers(true)}
          disabled={isLoading}
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs h-8.5 gap-1.5 shadow-2xs font-medium self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
          <span>Làm Mới</span>
        </Button>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">Quản Trị Người Dùng &amp; Phân Quyền RBAC</h2>
        <p className="text-xs text-slate-500">Phân tách nhóm Khách hàng vs Đội ngũ, đóng băng ví on-chain và phân vai trò.</p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {activeTab === 'CUSTOMERS' ? 'Tổng Khách Hàng' : 'Tổng Đội Ngũ'}
            </span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">{totalCount}</div>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ví Web3 Đã Liên Kết</span>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 tabular-nums">{web3Count}</div>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Trọng Tài Viên</span>
            <ShieldCheck className="h-4 w-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">{arbitratorCount}</div>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ví Đang Đóng Băng</span>
            <Ban className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-700 tabular-nums">{frozenCount}</div>
        </Card>
      </div>

      {/* Primary Role Segmentation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-medium">
        <button
          type="button"
          onClick={() => handleTabChange('CUSTOMERS')}
          className={`flex items-center gap-2 pb-2.5 border-b-2 transition-all ${
            activeTab === 'CUSTOMERS'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="size-4" />
          <span>Khách Hàng (Buyer &amp; Seller)</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('STAFF')}
          className={`flex items-center gap-2 pb-2.5 border-b-2 transition-all ${
            activeTab === 'STAFF'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCog className="size-4" />
          <span>Đội Ngũ Quản Trị &amp; Trọng Tài</span>
        </button>
      </div>

      {/* Filters & Debounced Search Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo UUID, Email, ví Base58 Solana hoặc 0x..."
            className="pl-9 bg-slate-50 border-slate-200 text-xs min-h-[40px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            {(activeTab === 'CUSTOMERS' ? ['ALL', 'USER'] : ['ALL', 'ARBITRATOR', 'ADMIN']).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                  roleFilter === r
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Freeze Filter */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Bình thường' },
              { id: 'FROZEN', label: 'Đã khóa' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFreezeFilter(f.id)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                  freezeFilter === f.id
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
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
