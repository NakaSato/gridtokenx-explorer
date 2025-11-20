import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { BorshAccountsCoder } from '@coral-xyz/anchor';
import { IdlTypeDef } from '@coral-xyz/anchor/dist/cjs/idl';
import { Account } from '@/app/(core)/providers/accounts';
import { useAnchorProgram } from '@/app/(core)/providers/anchor';
import { useCluster } from '@/app/(core)/providers/cluster';
import { getAnchorProgramName, mapAccountToRows } from '@utils/anchor';
import React, { useMemo } from 'react';

export function AnchorAccountCard({ account }: { account: Account }) {
  const { lamports } = account;
  const { url, cluster } = useCluster();
  const { program: anchorProgram } = useAnchorProgram(account.owner.toString(), url, cluster);
  const rawData = account.data.raw;
  const programName = getAnchorProgramName(anchorProgram) || 'Unknown Program';

  const { decodedAccountData, accountDef } = useMemo(() => {
    let decodedAccountData: any | null = null;
    let accountDef: IdlTypeDef | undefined = undefined;
    if (anchorProgram && rawData) {
      const coder = new BorshAccountsCoder(anchorProgram.idl);
      const account = anchorProgram.idl.accounts?.find((accountType: any) =>
        (rawData as Buffer).slice(0, 8).equals(coder.accountDiscriminator(accountType.name)),
      );
      if (account) {
        accountDef = anchorProgram.idl.types?.find((type: any) => type.name === account.name);
        try {
          decodedAccountData = coder.decode(account.name, rawData);
        } catch (err) {
          console.log(err);
        }
      }
    }

    return {
      accountDef,
      decodedAccountData,
    };
  }, [anchorProgram, rawData]);

  if (lamports === undefined) return null;
  if (!anchorProgram) return <ErrorCard text="No Anchor IDL found" />;
  if (!decodedAccountData || !accountDef) {
    return <ErrorCard text="Failed to decode account data according to the public Anchor interface" />;
  }

  return (
    <div>
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {programName}: {accountDef.name.charAt(0).toUpperCase() + accountDef.name.slice(1)}
              </h3>
            </div>
          </div>
        </div>

        <div className="mb-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-1">Field</th>
                <th className="w-1">Type</th>
                <th className="w-1">Value</th>
              </tr>
            </thead>
            <tbody>{mapAccountToRows(decodedAccountData, accountDef as IdlTypeDef, anchorProgram.idl)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
