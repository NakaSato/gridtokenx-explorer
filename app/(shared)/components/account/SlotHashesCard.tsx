import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Copyable } from '@/app/(shared)/components/Copyable';

interface SysvarAccount {
  type: string;
  info: {
    slotHashes: Array<{
      slot: number;
      hash: string;
    }>;
  };
}

interface SlotHashesCardProps {
  sysvarAccount: SysvarAccount;
}

export function SlotHashesCard({ sysvarAccount }: SlotHashesCardProps) {
  const { slotHashes } = sysvarAccount.info;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slot Hashes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {slotHashes.map((item, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <div className="font-medium">Slot {item.slot}</div>
                <div className="text-muted-foreground font-mono text-sm">
                  <Copyable text={item.hash}>
                    {item.hash.slice(0, 16)}...{item.hash.slice(-16)}
                  </Copyable>
                </div>
              </div>
              <div className="text-muted-foreground text-sm">Hash #{index + 1}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
