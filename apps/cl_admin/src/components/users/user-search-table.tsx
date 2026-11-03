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
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30">SUPER ADMIN</Badge>;
      case 'ADMIN':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">ADMIN</Badge>;
      case 'ARBITRATOR':
        return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">ARBITRATOR</Badge>;
      default:
        return <Badge className="bg-slate-800 text-slate-300 border-slate-700">USER</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/80 border-b border-slate-800">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs font-mono uppercase tracking-wider py-3.5">
                  Người Dùng / Email
                </TableHead>
                <TableHead className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                  Địa Chỉ Ví Web3
                </TableHead>
                <TableHead className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                  Vai Trò
                </TableHead>
                <TableHead className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                  KYC & Ví
                </TableHead>
                <TableHead className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                  Kèo / Khiếu Nại
                </TableHead>
                <TableHead className="text-slate-400 text-xs font-mono uppercase tracking-wider text-right pr-4">
                  Thao Tác Quản Trị
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                      <span className="text-xs font-mono">Đang truy vấn cơ sở dữ liệu người dùng...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-slate-400 text-xs font-mono">
                    Không tìm thấy người dùng phù hợp với tiêu chí tra cứu.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isSolana = user.walletAddress && !user.walletAddress.startsWith('0x');
                  const isFrozen = user.isFrozen ?? false;
                  const disputeRate = user.disputeRate ?? 0;

                  return (
                    <TableRow key={user.id} className="border-slate-800/80 hover:bg-slate-900/50 transition-colors">
                      {/* Identity Column */}
                      <TableCell className="py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                            {user.displayName || 'Vô danh'}
                            {isFrozen && (
                              <span className="text-[10px] text-rose-400 font-mono px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800">
                                FROZEN
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{user.email || 'Chưa liên kết email'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">UUID: {user.id.slice(0, 8)}...</span>
                        </div>
                      </TableCell>

                      {/* Wallet Column */}
                      <TableCell>
                        {user.walletAddress ? (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs text-cyan-300">
                                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-6)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {isSolana ? 'Solana Devnet (Base58)' : 'Base Sepolia (EVM 0x)'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(user.walletAddress!, user.id)}
                              className="h-8 w-8 min-h-[44px] min-w-[44px] p-0 text-slate-400 hover:text-cyan-300"
                              title="Sao chép ví"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Chưa kết nối ví</span>
                        )}
                      </TableCell>

                      {/* Role Column */}
                      <TableCell>{getRoleBadge(user.role)}</TableCell>

                      {/* KYC & Wallet Status */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            {user.kycStatus || 'VERIFIED'}
                          </span>
                          {user.walletBalanceSol !== undefined && user.walletBalanceSol !== null && (
                            <span className="text-[11px] font-mono text-cyan-400">
                              {user.walletBalanceSol} SOL
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Dispute & Deals Column */}
                      <TableCell>
                        <div className="flex flex-col text-xs font-mono">
                          <span className="text-slate-300">Tổng kèo: {user.totalDeals ?? 0}</span>
                          <span className={disputeRate > 20 ? 'text-rose-400' : 'text-slate-400'}>
                            Khiếu nại: {user.totalDisputes ?? 0} ({disputeRate}%)
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="text-right pr-4">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRoleModalUser(user)}
                            className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs h-9 min-h-[44px] px-3 gap-1.5 text-slate-200"
                          >
                            <UserCog className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Phân Quyền</span>
                          </Button>

                          <Button
                            variant={isFrozen ? 'default' : 'destructive'}
                            size="sm"
                            onClick={() => setFreezeModalUser(user)}
                            className={`text-xs h-9 min-h-[44px] px-3 gap-1.5 ${
                              isFrozen
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-rose-600/90 hover:bg-rose-600 text-white'
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
                                <span>Khóa Ví</span>
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
