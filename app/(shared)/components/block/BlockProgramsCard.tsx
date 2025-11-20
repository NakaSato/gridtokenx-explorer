import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Copyable } from '@/app/(shared)/components/Copyable';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Address } from '@/app/(shared)/components/Address';

interface ProgramInfo {
  programId: string;
  name?: string;
  instructionCount: number;
  computeUnits?: number;
}

interface BlockProgramsCardProps {
  programs: ProgramInfo[];
  block: {
    slot: number;
  };
}

export function BlockProgramsCard({ programs, block }: BlockProgramsCardProps) {
  const getProgramName = (programId: string, name?: string) => {
    if (name) return name;

    const knownPrograms: Record<string, string> = {
      '11111111111111111111111111111111': 'System Program',
      TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'Token Program',
      TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBwCXeanmu7w: 'Token-2022 Program',
      SysvarRent111111111111111111111111111111111: 'Rent Sysvar',
      SysvarC1ock11111111111111111111111111111111: 'Clock Sysvar',
      SysvarRecentB1ockHashes11111111111111111111: 'Recent Blockhashes Sysvar',
    };

    return knownPrograms[programId] || 'Unknown Program';
  };

  const getTotalInstructions = () => {
    return programs.reduce((total, program) => total + program.instructionCount, 0);
  };

  const getTotalComputeUnits = () => {
    return programs.reduce((total, program) => total + (program.computeUnits || 0), 0);
  };

  if (!programs || programs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Program Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">No program activity in this block</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Programs: </span>
              <span className="font-medium">{programs.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Instructions: </span>
              <span className="font-medium">{getTotalInstructions()}</span>
            </div>
          </div>

          <div className="text-muted-foreground text-sm">Programs active in block {block.slot}</div>

          {programs.slice(0, 15).map((program, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <Badge variant="outline">
                    {program.instructionCount} instruction{program.instructionCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
                {program.computeUnits && (
                  <div className="text-muted-foreground text-sm">{(program.computeUnits / 1000000).toFixed(1)}M CU</div>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground text-xs">Name: </span>
                  <span className="text-sm font-medium">{getProgramName(program.programId, program.name)}</span>
                </div>

                <div>
                  <span className="text-muted-foreground text-xs">Program ID: </span>
                  <Address pubkey={program.programId as any} link truncate />
                </div>
              </div>
            </div>
          ))}

          {programs.length > 15 && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              ... and {programs.length - 15} more program{programs.length - 15 !== 1 ? 's' : ''}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Compute: </span>
                <span className="font-medium">{(getTotalComputeUnits() / 1000000).toFixed(1)}M CU</span>
              </div>
              <div>
                <span className="text-muted-foreground">Block: </span>
                <Copyable text={block.slot.toString()}>{block.slot.toString()}</Copyable>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
