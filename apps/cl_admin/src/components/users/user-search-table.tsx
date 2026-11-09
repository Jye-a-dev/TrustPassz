'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  Unlock,
  UserCog,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminUser, UserRole } from '@/types';
import { toast } from 'sonner';
import { UserRoleDialog } from './user-role-dialog';
import { UserFreezeDialog } from './user-freeze-dialog';

interface UserSearchTableProps {
  users: AdminUser[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateRole: (user: AdminUser, role: UserRole, reason: string) => Promise<void>;
  onToggleFreeze: (user: AdminUser, freeze: boolean, reason: string) => Promise<void>;
}

export function UserSearchTable({
  users,
  isLoading,
  onRefresh,
  onUpdateRole,
  onToggleFreeze,
}: UserSearchTableProps) {
  const [roleModalUser, setRoleModalUser] = React.useState<AdminUser | null>(null);
  const [freezeModalUser, setFreezeModalUser] = React.useState<AdminUser | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold px-2 py-0.5">SUPER ADMIN</span>;
      case 'ADMIN':
        return <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-2 py-0.5">ADMIN</span>;
      case 'ARBITRATOR':
        return <span className="rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-semibold px-2 py-0.5">ARBITRATOR</span>;
      default:
        return <span className="rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[11px] px-2 py-0.5">USER</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  Người Dùng / Email
                </TableHead>
                <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  Địa Chỉ Ví Web3
                </TableHead>
                <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  Vai Trò
                </TableHead>
                <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  KYC &amp; Ví
                </TableHead>
                <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  Kèo / Khiếu Nại
                </TableHead>
                <TableHead className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider py-3 px-4 text-right pr-4">
                  Thao Tác Quản Trị
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-700" />
                      <span className="text-xs font-mono">Đang truy vấn cơ sở dữ liệu người dùng...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-slate-500 text-xs font-mono">
                    Không tìm thấy người dùng phù hợp với tiêu chí tra cứu.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isSolana = user.walletAddress && !user.walletAddress.startsWith('0x');
                  const isFrozen = user.isFrozen ?? false;
                  const disputeRate = user.disputeRate ?? 0;

                  return (
                    <TableRow key={user.id} className="border-slate-100 hover:bg-slate-50/80 transition-colors">
                      {/* Identity Column */}
                      <TableCell className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                            {user.displayName || 'Vô danh'}
                            {isFrozen && (
                              <span className="text-[10px] text-rose-700 font-mono px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">
                                FROZEN
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{user.email || 'Chưa liên kết email'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">UUID: {user.id.slice(0, 8)}...</span>
                        </div>
                      </TableCell>

                      {/* Wallet Column */}
                      <TableCell className="py-3.5 px-4">
                        {user.walletAddress ? (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col font-mono">
                              <span className="text-xs text-slate-600 font-semibold tabular-nums">
                                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-6)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans">
                                {isSolana ? 'Solana Devnet (Base58)' : 'Base Sepolia (EVM 0x)'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(user.walletAddress!, user.id)}
                              className="h-8 w-8 min-h-8 min-w-8 p-0 text-slate-400 hover:text-slate-800"
                              title="Sao chép ví"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa kết nối ví</span>
                        )}
                      </TableCell>

                      {/* Role Column */}
                      <TableCell className="py-3.5 px-4">{getRoleBadge(user.role)}</TableCell>

                      {/* KYC & Wallet Status */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {user.kycStatus || 'VERIFIED'}
                          </span>
                          {user.walletBalanceSol !== undefined && user.walletBalanceSol !== null && (
                            <span className="text-[11px] font-mono font-bold text-slate-900 tabular-nums">
                              {user.walletBalanceSol} SOL
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Dispute & Deals Column */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex flex-col text-xs font-mono">
                          <span className="text-slate-700">Tổng kèo: {user.totalDeals ?? 0}</span>
                          <span className={disputeRate > 20 ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
                            Khiếu nại: {user.totalDisputes ?? 0} ({disputeRate}%)
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="py-3.5 px-4 text-right pr-4">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRoleModalUser(user)}
                            className="border-slate-200 bg-white hover:bg-slate-50 text-xs h-8 px-2.5 gap-1.5 text-slate-700 shadow-2xs font-medium"
                          >
                            <UserCog className="h-3.5 w-3.5 text-slate-500" />
                            <span>Đổi quyền</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFreezeModalUser(user)}
                            className={`text-xs h-8 px-2.5 gap-1.5 shadow-2xs font-medium border ${
                              isFrozen
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                : 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                            }`}
                          >
                            {isFrozen ? (
                              <>
                                <Unlock className="h-3.5 w-3.5" />
                                <span>Mở Khóa</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5" />
                                <span>Đóng băng</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UserRoleDialog
        user={roleModalUser}
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        onConfirm={onUpdateRole}
      />

      <UserFreezeDialog
        user={freezeModalUser}
        isOpen={!!freezeModalUser}
        onClose={() => setFreezeModalUser(null)}
        onConfirm={onToggleFreeze}
      />
    </div>
  );
}
