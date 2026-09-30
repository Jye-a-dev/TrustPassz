'use client';

import * as React from 'react';
import {
  Users,
  Search,
  Ban,
  Key,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { AdminUser, UserRole } from '@/types';
import { logAdminAction } from '@/lib/audit-logger';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface UserRecord extends AdminUser {
  status: 'ACTIVE' | 'FROZEN' | 'BLACKLISTED';
  dealCount: number;
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');
  const [editingUser, setEditingUser] = React.useState<UserRecord | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('USER');

  React.useEffect(() => {
    let ignore = false;
    apiClient<AdminUser[]>('/api/v1/users', {
      params: {
        role: roleFilter === 'ALL' ? undefined : roleFilter,
      },
    })
      .then((res) => {
        if (!ignore) {
          const mapped: UserRecord[] = res.map((u) => ({
            ...u,
            status: 'ACTIVE',
            dealCount: 0,
          }));
          setUsers(mapped);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Lỗi truy vấn người dùng';
          toast.error(msg);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [roleFilter]);

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.walletAddress || '').toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user);
    setSelectedRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;

    try {
      await apiClient(`/api/v1/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: selectedRole }),
      });

      await logAdminAction('UPDATE_USER_ROLE', 'users', editingUser.id, {
        previousRole: editingUser.role,
        newRole: selectedRole,
        userEmail: editingUser.email,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, role: selectedRole } : u))
      );

      toast.success(`Đã cập nhật vai trò người dùng sang ${selectedRole}.`);
      setEditingUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật vai trò thất bại';
      toast.error(msg);
    }
  };

  const handleToggleFreeze = async (user: UserRecord) => {
    const newStatus = user.status === 'FROZEN' || user.status === 'BLACKLISTED' ? 'ACTIVE' : 'BLACKLISTED';

    await logAdminAction('CHANGE_USER_STATUS', 'users', user.id, {
      previousStatus: user.status,
      newStatus,
      userEmail: user.email,
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );

    toast.success(
      newStatus === 'BLACKLISTED'
        ? `Đã khóa (Blacklist) tài khoản ${user.displayName}.`
        : `Đã mở khóa tài khoản ${user.displayName}.`
    );
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'border-rose-800 text-rose-400 bg-rose-950/40';
      case 'ARBITRATOR':
        return 'border-cyan-800 text-cyan-400 bg-cyan-950/40';
      case 'SELLER':
        return 'border-emerald-800 text-emerald-400 bg-emerald-950/40';
      case 'BUYER':
        return 'border-blue-800 text-blue-400 bg-blue-950/40';
      default:
        return 'border-slate-800 text-slate-400 bg-slate-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-400" />
            Quản Trị Người Dùng & Phân Quyền (RBAC)
          </h2>
          <p className="text-xs text-slate-400">
            Quản lý tài khoản, nâng/hạ quyền Admin & Arbitrator, kiểm soát Smart Account và đóng băng vi phạm.
          </p>
        </div>
        <Badge variant="outline" className="border-cyan-800 text-cyan-400 font-mono text-xs w-fit">
          {filteredUsers.length} Tài khoản
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hiển thị, email hoặc địa chỉ ví..."
            className="pl-9 border-slate-800 bg-[#0F172A] text-xs text-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'ADMIN', 'ARBITRATOR', 'SELLER', 'BUYER', 'USER'].map((r) => (
            <button
              key={r}
              onClick={() => {
                setIsLoading(true);
                setRoleFilter(r);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-65">Người dùng</TableHead>
              <TableHead>Địa chỉ ví Smart Account</TableHead>
              <TableHead>Vai trò RBAC</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Số Kèo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    <span>Đang tải danh sách người dùng...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                  Không tìm thấy người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white text-xs">{user.displayName}</p>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">
                    {user.walletAddress ? (
                      <span className="text-cyan-400">
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                      </span>
                    ) : (
                      <span className="text-slate-600">Chưa liên kết</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-mono text-[10px] ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-mono text-[10px] ${
                        user.status === 'ACTIVE'
                          ? 'border-emerald-800 text-emerald-400 bg-emerald-950/40'
                          : 'border-rose-800 text-rose-400 bg-rose-950/40'
                      }`}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">{user.dealCount}</TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(user)}
                      className="h-8 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                      <Key className="h-3.5 w-3.5 mr-1 text-cyan-400" />
                      Đổi Role
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFreeze(user)}
                      className={`h-8 px-2 text-xs ${
                        user.status === 'BLACKLISTED'
                          ? 'text-emerald-400 hover:bg-emerald-950/30'
                          : 'text-rose-400 hover:bg-rose-950/30'
                      }`}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      {user.status === 'BLACKLISTED' ? 'Bỏ Chặn' : 'Blacklist'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Modifier Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="border-slate-800 bg-[#0F172A] text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Cập Nhật Quyền Hạn Người Dùng
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              User: <strong className="text-white">{editingUser?.displayName}</strong> ({editingUser?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <label className="font-semibold text-slate-300">Chọn vai trò mới (Role Assignment):</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full h-9 rounded-md border border-slate-800 bg-[#080C14] px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="USER">USER (Người dùng thông thường)</option>
              <option value="BUYER">BUYER (Người mua đã KYC)</option>
              <option value="SELLER">SELLER (Người bán có Digital Storefront)</option>
              <option value="ARBITRATOR">ARBITRATOR (Trọng tài viên phân xử khiếu nại)</option>
              <option value="ADMIN">ADMIN (Super Admin toàn quyền)</option>
            </select>
          </div>

          <DialogFooter className="border-t border-slate-800 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)} className="text-xs text-slate-400">
              Hủy
            </Button>
            <Button size="sm" onClick={handleSaveRole} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-8">
              Lưu Thay Đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
