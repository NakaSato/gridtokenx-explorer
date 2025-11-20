import { PublicKey } from '@solana/web3.js';
import { useClusterPath } from '@/app/(shared)/utils/url';
import { ProgramDataAccountInfo } from '@validators/accounts/upgradeable-program';
import Link from 'next/link';

import { useProgramMetadataSecurityTxt } from '@/app/entities/program-metadata';
import { useCluster } from '@/app/providers/cluster';

import { fromProgramData } from '../lib/fromProgramData';

export function ProgramSecurityTXTBadge({
  programData,
  programPubkey,
}: {
  programData: ProgramDataAccountInfo;
  programPubkey: PublicKey;
}) {
  const { securityTXT, error } = fromProgramData(programData);
  const securityTabPath = useClusterPath({ pathname: `/address/${programPubkey.toBase58()}/security` });

  const { url, cluster } = useCluster();
  const { programMetadataSecurityTxt } = useProgramMetadataSecurityTxt(programPubkey.toBase58(), url, cluster);

  const maybeError = securityTXT || programMetadataSecurityTxt ? undefined : error;

  return <SecurityTXTBadge error={maybeError} tabPath={securityTabPath} />;
}

export function SecurityTXTBadge({ error, tabPath }: { error?: string; tabPath: string }) {
  if (error) {
    return (
      <h3 className="mb-0">
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
          {error}
        </span>
      </h3>
    );
  }

  return (
    <h3 className="mb-0">
      <Link
        className="inline-flex cursor-pointer items-center rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white"
        href={tabPath}
      >
        Included
      </Link>
    </h3>
  );
}
