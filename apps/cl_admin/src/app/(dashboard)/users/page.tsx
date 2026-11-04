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
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-400" />
            Quản Trị Người Dùng & Phân Quyền RBAC
          </h2>
          <p className="text-xs text-slate-400">
            Tra cứu tức thì theo UUID, Email, Địa chỉ ví Solana (Base58) và Base Sepolia (0x). Phân tách chặt chẽ khách hàng và đội ngũ quản trị.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers(true)}
          disabled={isLoading}
          className="border-slate-800 bg-cyber-card hover:bg-slate-800 text-slate-200 text-xs h-9 min-h-11 gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Làm Mới</span>
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-cyber-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              {activeTab === 'CUSTOMERS' ? 'Tổng Khách Hàng' : 'Tổng Đội Ngũ'}
            </span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">{totalCount}</div>
        </Card>

        <Card className="border-slate-800 bg-cyber-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Ví Web3 Đã Liên Kết</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{web3Count}</div>
        </Card>

        <Card className="border-slate-800 bg-cyber-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Trọng Tài Viên</span>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">{arbitratorCount}</div>
        </Card>

        <Card className="border-slate-800 bg-cyber-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Ví Đang Đóng Băng</span>
            <Ban className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">{frozenCount}</div>
        </Card>
      </div>

      {/* Primary Role Segmentation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('CUSTOMERS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono border-b-2 transition-all min-h-11 ${
            activeTab === 'CUSTOMERS'
              ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="size-4" />
          <span>Khách Hàng (Buyer & Seller)</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('STAFF')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono border-b-2 transition-all min-h-11 ${
            activeTab === 'STAFF'
              ? 'border-amber-400 text-amber-400 font-bold bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCog className="size-4" />
          <span>Đội Ngũ Quản Trị & Trọng Tài</span>
        </button>
      </div>

      {/* Filters & Debounced Search Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-cyber-card p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo UUID, Email, ví Base58 Solana hoặc 0x..."
            className="pl-9 bg-slate-900 border-slate-800 text-xs min-h-11 text-slate-200 placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter Buttons */}
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-1">
            {(activeTab === 'CUSTOMERS' ? ['ALL', 'USER'] : ['ALL', 'ARBITRATOR', 'ADMIN']).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-colors min-h-8 ${
                  roleFilter === r
                    ? 'bg-cyan-500/20 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Freeze Filter */}
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-1">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Bình thường' },
              { id: 'FROZEN', label: 'Đã khóa' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFreezeFilter(f.id)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-colors min-h-8 ${
                  freezeFilter === f.id
                    ? 'bg-rose-500/20 text-rose-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
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
