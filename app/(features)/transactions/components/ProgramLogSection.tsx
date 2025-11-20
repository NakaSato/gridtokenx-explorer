import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { ProgramLogsCardBody } from '@/app/components/ProgramLogsCardBody';
import { useCluster } from '@/app/(core)/providers/cluster';
import { useTransactionDetails } from '@/app/(core)/providers/transactions';
import { SignatureProps } from '@/app/(shared)/utils/index';
import { parseProgramLogs } from '@/app/(shared)/utils/program-logs';
import React from 'react';
import { Code } from 'react-feather';

export function ProgramLogSection({ signature }: SignatureProps) {
  const [showRaw, setShowRaw] = React.useState(false);
  const { cluster, url } = useCluster();
  const details = useTransactionDetails(signature);

  const transactionWithMeta = details?.data?.transactionWithMeta;
  if (!transactionWithMeta) return null;
  const message = transactionWithMeta.transaction.message;

  const logMessages = transactionWithMeta.meta?.logMessages || null;
  const err = transactionWithMeta.meta?.err || null;

  let prettyLogs = null;
  if (logMessages !== null) {
    prettyLogs = parseProgramLogs(logMessages, err, cluster);
  }

  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Program Instruction Logs</h3>
          <button
            className={`flex items-center rounded-md px-3 py-1.5 text-sm ${showRaw ? 'bg-gray-800 text-white' : 'border hover:bg-gray-100'}`}
            onClick={() => setShowRaw(r => !r)}
          >
            <Code className="mr-2" size={13} /> Raw
          </button>
        </div>
        {prettyLogs !== null ? (
          showRaw ? (
            <RawProgramLogs raw={logMessages!} />
          ) : (
            <ProgramLogsCardBody message={message} logs={prettyLogs} cluster={cluster} url={url} />
          )
        ) : (
          <div className="p-6">Logs not supported for this transaction</div>
        )}
      </div>
    </>
  );
}

const RawProgramLogs = ({ raw }: { raw: string[] }) => {
  return (
    <TableCardBody>
      <tr>
        <td>
          <pre className="text-start">{JSON.stringify(raw, null, 2)}</pre>
        </td>
      </tr>
    </TableCardBody>
  );
};
