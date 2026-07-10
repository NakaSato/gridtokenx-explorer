'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/(shared)/components/ui/table';
import { User as UserIcon, ShieldCheck } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';
import { Address } from '@/app/(shared)/components/Address';

interface UserData {
  address: string;
  wallet: string;
  userType: string;
  isRegistered: boolean;
  meterCount: number;
}

interface UsersTableProps {
  users: UserData[];
}

/** Plain pubkey-like wrapper so <Address> never constructs a web3.js PublicKey
 * (dodges the dual-package `instanceof` trap under Turbopack). */
const pk = (address: string) => ({ toBase58: () => address });

export function UsersTable({ users }: UsersTableProps) {
  return (
    <Table className="font-mono">
      <TableHeader className="bg-[#0a0a0a]">
        <TableRow className="border-[#2a2a2a] hover:bg-transparent">
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Wallet Address</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Role</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Status</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Meters</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666] text-right">Account (PDA)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow className="border-[#1a1a1a]">
            <TableCell colSpan={5} className="h-32 text-center text-[#555] text-xs italic">
              No registered users found in the system
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.address} className="border-[#1a1a1a] hover:bg-[#9945FF]/5 transition-colors">
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5 shrink-0 text-[#666]" />
                  <div className="font-mono text-xs text-[#9945FF] hover:text-white">
                    <Address pubkey={pk(user.wallet)} link raw />
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <span className="bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] font-medium text-[#14F195]">
                  {user.userType}
                </span>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={cn("h-3.5 w-3.5", user.isRegistered ? "text-[#14F195]" : "text-[#ff8c00]")} />
                  <span className={cn("text-[11px] font-bold", user.isRegistered ? "text-[#14F195]" : "text-[#ff8c00]")}>{user.isRegistered ? 'Verified' : 'Pending'}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 font-mono text-xs text-[#e0e0e0]">{user.meterCount}</TableCell>
              <TableCell className="py-2 text-right">
                <div className="font-mono text-[10px] text-[#888] hover:text-[#9945FF]">
                  <Address pubkey={pk(user.address)} link raw alignRight />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
