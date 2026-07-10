import { Address as AddressComponent } from '@/app/(shared)/components/common/Address';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/(shared)/components/ui/table';
import { toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import { VersionedBlockResponse } from '@solana/web3.js';
import React from 'react';

export function BlockProgramsCard({ block }: { block: VersionedBlockResponse }) {
  const totalTransactions = block.transactions.length;
  const txSuccesses = new Map<string, number>();
  const txFrequency = new Map<string, number>();
  const ixFrequency = new Map<string, number>();

  let totalInstructions = 0;
  block.transactions.forEach(tx => {
    const message = tx.transaction.message;
    totalInstructions += message.compiledInstructions.length;
    const programUsed = new Set<string>();
    const accountKeys = tx.transaction.message.getAccountKeys({
      accountKeysFromLookups: tx.meta?.loadedAddresses,
    });
    const trackProgram = (index: number) => {
      if (index >= accountKeys.length) return;
      const programId = accountKeys.get(index)!;
      const programAddress = programId.toBase58();
      programUsed.add(programAddress);
      const frequency = ixFrequency.get(programAddress);
      ixFrequency.set(programAddress, frequency ? frequency + 1 : 1);
    };

    message.compiledInstructions.forEach(ix => trackProgram(ix.programIdIndex));
    tx.meta?.innerInstructions?.forEach(inner => {
      totalInstructions += inner.instructions.length;
      inner.instructions.forEach(innerIx => trackProgram(innerIx.programIdIndex));
    });

    const successful = tx.meta?.err === null;
    programUsed.forEach(programId => {
      const frequency = txFrequency.get(programId);
      txFrequency.set(programId, frequency ? frequency + 1 : 1);
      if (successful) {
        const count = txSuccesses.get(programId);
        txSuccesses.set(programId, count ? count + 1 : 1);
      }
    });
  });

  const programEntries: [string, number][] = [];
  txFrequency.forEach((txFreq, programId) => {
    programEntries.push([programId, txFreq]);
  });

  programEntries.sort((a, b) => {
    if (a[1] < b[1]) return 1;
    if (a[1] > b[1]) return -1;
    return 0;
  });

  const showSuccessRate = block.transactions.every(tx => tx.meta !== null);
  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="flex items-center border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Block Program Stats</h3>
        </div>
        <TableCardBody>
          <tr>
            <td className="w-full">Unique Programs Count</td>
            <td className="font-mono lg:text-right">{programEntries.length}</td>
          </tr>
          <tr>
            <td className="w-full">Total Instructions</td>
            <td className="font-mono lg:text-right">{totalInstructions}</td>
          </tr>
        </TableCardBody>
      </div>
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="flex items-center border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Block Programs</h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>Transaction Count</TableHead>
              <TableHead>% of Total</TableHead>
              <TableHead>Instruction Count</TableHead>
              <TableHead>% of Total</TableHead>
              {showSuccessRate && <TableHead>Success Rate</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {programEntries.map(([programId, txFreq]) => {
              const ixFreq = ixFrequency.get(programId) as number;
              const successes = txSuccesses.get(programId) || 0;
              return (
                <TableRow key={programId}>
                  <TableCell>
                    <AddressComponent pubkey={addressToPublicKey(toAddress(programId))} link />
                  </TableCell>
                  <TableCell>{txFreq}</TableCell>
                  <TableCell>{((100 * txFreq) / totalTransactions).toFixed(2)}%</TableCell>
                  <TableCell>{ixFreq}</TableCell>
                  <TableCell>{((100 * ixFreq) / totalInstructions).toFixed(2)}%</TableCell>
                  {showSuccessRate && <TableCell>{((100 * successes) / txFreq).toFixed(0)}%</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
