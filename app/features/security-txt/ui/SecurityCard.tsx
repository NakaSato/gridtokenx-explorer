import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle } from 'react-feather';

import { DownloadableButton } from '@/app/(shared)/components/Downloadable';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { useProgramMetadataSecurityTxt } from '@/app/entities/program-metadata';
import type { UpgradeableLoaderAccountData } from '@/app/(core)/providers/accounts';
import { useCluster } from '@/app/(core)/providers/cluster';

import { NO_SECURITY_TXT_ERROR } from '../lib/constants';
import { fromProgramData } from '../lib/fromProgramData';
import type { NeodymeSecurityTXT } from '../lib/types';
import { SecurityTxtVersionBadge } from './common';
import { EmptySecurityTxtCard } from './EmptySecurityTxtCard';
import { NeodymeSecurityTxtTable } from './NeodymeSecurityTxtTable';
import { PmpSecurityTxtTable } from './PmpSecurityTxtTable';
import { securityTxtDataToBase64 } from './utils';

export function SecurityCard({ data, pubkey }: { data: UpgradeableLoaderAccountData; pubkey: PublicKey }) {
  const { url, cluster } = useCluster();
  const { programMetadataSecurityTxt } = useProgramMetadataSecurityTxt(pubkey.toBase58(), url, cluster);

  if (!data.programData) {
    return <ErrorCard text="Account has no data" />;
  }

  const { securityTXT, error } = fromProgramData(data.programData);

  if (!securityTXT && !programMetadataSecurityTxt && error) {
    if (error === NO_SECURITY_TXT_ERROR) {
      return <EmptySecurityTxtCard programAddress={pubkey.toString()} />;
    } else {
      return <ErrorCard text={error} />;
    }
  }
  return (
    <ProgramSecurityTxtCard
      programAddress={pubkey.toBase58()}
      programDataSecurityTxt={securityTXT}
      pmpSecurityTxt={programMetadataSecurityTxt}
    />
  );
}

// Accepts security.txt from Program Data and Program Metadata json
// By default renders security.txt json from Program Metadata
// Fallback to Program Data security.txt
export function ProgramSecurityTxtCard({
  programAddress,
  programDataSecurityTxt,
  pmpSecurityTxt,
}: {
  programAddress: string;
  programDataSecurityTxt: NeodymeSecurityTXT | undefined;
  pmpSecurityTxt: any;
}) {
  const downloadData = useMemo(() => {
    if (!pmpSecurityTxt && !programDataSecurityTxt) return '';
    return securityTxtDataToBase64(pmpSecurityTxt || programDataSecurityTxt);
  }, [programDataSecurityTxt, pmpSecurityTxt]);

  if (!programDataSecurityTxt && !pmpSecurityTxt) {
    return <EmptySecurityTxtCard programAddress={programAddress} />;
  }

  // Determine which table component to render
  const securityTable = pmpSecurityTxt ? (
    <PmpSecurityTxtTable data={pmpSecurityTxt} />
  ) : programDataSecurityTxt ? (
    <NeodymeSecurityTxtTable data={programDataSecurityTxt} />
  ) : null;

  return (
    <div className="card security-txt overflow-hidden">
      <div className="card-header flex h-auto min-h-[60px] items-center">
        <h3 className="card-header-title mr-4 mb-0 flex items-center gap-3">
          Security.txt
          <SecurityTxtVersionBadge version={pmpSecurityTxt ? 'pmp' : 'neodyme'} />
        </h3>
        <div className="flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100">
          <DownloadableButton
            data={downloadData}
            filename={`${programAddress}-security-txt.json`}
            type="application/json"
          >
            Download
          </DownloadableButton>
        </div>
      </div>
      <div className="px-6 py-4">
        <small className="text-warning flex gap-1">
          <AlertCircle size={16} className="mt-0.5" />
          Note that this is self-reported by the author of the program and might not be accurate
        </small>
      </div>
      <ErrorBoundary fallback={<div className="p-6 text-center">Invalid security.txt</div>}>
        {securityTable}
      </ErrorBoundary>
    </div>
  );
}
