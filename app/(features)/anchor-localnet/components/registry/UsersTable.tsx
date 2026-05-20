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
import { Badge } from '@/app/(shared)/components/ui/badge';
import { User as UserIcon, ShieldCheck } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';

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

export function UsersTable({ users }: UsersTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Wallet Address</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Role</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Status</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Meters</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Account</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs italic">
              No registered users found in the system
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.address} className="hover:bg-muted/30 transition-colors">
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-xs truncate w-32" title={user.wallet}>{user.wallet}</span>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <Badge variant="secondary" className="text-[10px] font-medium h-5">
                  {user.userType}
                </Badge>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={cn("h-3.5 w-3.5", user.isRegistered ? "text-green-500" : "text-muted-foreground")} />
                  <span className="text-[11px] font-bold">{user.isRegistered ? 'Verified' : 'Pending'}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 font-mono text-xs">{user.meterCount}</TableCell>
              <TableCell className="py-2 text-right">
                <span className="font-mono text-[9px] text-muted-foreground">{user.address.slice(0, 8)}...</span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
