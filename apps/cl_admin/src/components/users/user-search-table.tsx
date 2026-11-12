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
        return (
          <span className="rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 text-[11px] font-semibold px-2.5 py-0.5 font-mono">
            SUPER ADMIN
          </span>
        );
      case 'ADMIN':
        return (
          <span className="rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/30 text-[11px] font-semibold px-2.5 py-0.5 font-mono">
            ADMIN
          </span>
        );
      case 'ARBITRATOR':
        return (
          <span className="rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 text-[11px] font-semibold px-2.5 py-0.5 font-mono">
            ARBITRATOR
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/30 text-[11px] font-medium px-2 py-0.5 font-mono">
            USER
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border-subtle">
              <TableRow className="border-border-subtle hover:bg-transparent">
                <TableHead className="text-text-muted text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  Người Dùng / Email
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  Địa Chỉ Ví Web3
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  Vai Trò
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  KYC &amp; Ví
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-semibold uppercase tracking-wider py-3 px-4">
                  Giao Dịch / Khiếu Nại
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-semibold uppercase tracking-wider py-3 px-4 text-right pr-4">
                  Thao Tác Quản Trị
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border-subtle text-xs">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-text-muted">
                      <Loader2 className="h-6 w-6 animate-spin text-text-primary" />
                      <span className="text-xs font-mono">Đang truy vấn cơ sở dữ liệu người dùng...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-text-muted text-xs font-mono">
                    Không tìm thấy người dùng phù hợp với tiêu chí tra cứu.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isSolana = user.walletAddress && !user.walletAddress.startsWith('0x');
                  const isFrozen = user.isFrozen ?? false;
                  const disputeRate = user.disputeRate ?? 0;

                  return (
                    <TableRow key={user.id} className="border-border-subtle hover:bg-muted/40 transition-colors">
                      {/* Identity Column */}
                      <TableCell className="py-3.5 px-4 font-medium text-text-primary">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                            {user.displayName || 'Vô danh'}
                            {isFrozen && (
                              <span className="text-[10px] text-rose-500 font-mono px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30">
                                FROZEN
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-text-muted font-mono">{user.email || 'Chưa liên kết email'}</span>
                          <span className="text-[10px] text-text-muted font-mono">UUID: {user.id.slice(0, 8)}...</span>
                        </div>
                      </TableCell>

                      {/* Wallet Column */}
                      <TableCell className="py-3.5 px-4">
                        {user.walletAddress ? (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col font-mono">
                              <span className="text-xs text-text-primary font-semibold tabular-nums">
                                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-6)}
                              </span>
                              <span className="text-[10px] text-text-muted font-sans">
                                {isSolana ? 'Solana Devnet (Base58)' : 'Base Sepolia (EVM 0x)'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(user.walletAddress!, user.id)}
                              className="h-8 w-8 min-h-8 min-w-8 p-0 text-text-muted hover:text-text-primary cursor-pointer"
                              title="Sao chép ví"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted italic">Chưa kết nối ví</span>
                        )}
                      </TableCell>

                      {/* Role Column */}
                      <TableCell className="py-3.5 px-4">{getRoleBadge(user.role)}</TableCell>

                      {/* KYC & Wallet Status */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            {user.kycStatus || 'VERIFIED'}
                          </span>
                          {user.walletBalanceSol !== undefined && user.walletBalanceSol !== null && (
                            <span className="text-[11px] font-mono font-bold text-text-primary tabular-nums">
                              {user.walletBalanceSol} SOL
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Dispute & Deals Column */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex flex-col text-xs font-mono">
                          <span className="text-text-primary">Tổng giao dịch: {user.totalDeals ?? 0}</span>
                          <span className={disputeRate > 20 ? 'text-rose-500 font-semibold' : 'text-text-muted'}>
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
                            className="border-border-subtle bg-surface hover:bg-muted text-xs h-8 px-2.5 gap-1.5 text-text-primary shadow-2xs font-medium cursor-pointer"
                          >
                            <UserCog className="h-3.5 w-3.5 text-text-muted" />
                            <span>Đổi quyền</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFreezeModalUser(user)}
                            className={`text-xs h-8 px-2.5 gap-1.5 shadow-2xs font-medium border cursor-pointer ${
                              isFrozen
                                ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                                : 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
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
