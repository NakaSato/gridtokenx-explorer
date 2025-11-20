import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { ParsedMessage, PublicKey, VersionedMessage } from '@solana/web3.js';
import { Cluster } from '@/app/(shared)/utils/cluster';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import { InstructionLogs } from '@/app/(shared)/utils/program-logs';
import { ProgramName } from '@/app/(shared)/utils/program-name';
import { useClusterPath } from '@/app/(shared)/utils/url';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { ChevronsUp } from 'react-feather';

const NATIVE_PROGRAMS_MISSING_INVOKE_LOG: string[] = [
  'AddressLookupTab1e1111111111111111111111111',
  'ZkTokenProof1111111111111111111111111111111',
  'BPFLoader1111111111111111111111111111111111',
  'BPFLoader2111111111111111111111111111111111',
  'BPFLoaderUpgradeab1e11111111111111111111111',
];

export function ProgramLogsCardBody({
  message,
  logs,
  cluster,
  url,
}: {
  message: VersionedMessage | ParsedMessage;
  logs: InstructionLogs[];
  cluster: Cluster;
  url: string;
}) {
  let logIndex = 0;
  let instructionProgramIds: PublicKey[];
  if ('compiledInstructions' in message) {
    instructionProgramIds = message.compiledInstructions.map(ix => {
      return message.staticAccountKeys[ix.programIdIndex];
    });
  } else {
    instructionProgramIds = message.instructions.map(ix => ix.programId);
  }

  return (
    <TableCardBody>
      {instructionProgramIds.map((programId, index) => {
        const programAddress = programId.toBase58();
        let programLogs: InstructionLogs | undefined = logs[logIndex];
        if (programLogs?.invokedProgram === programAddress) {
          logIndex++;
        } else if (
          programLogs?.invokedProgram === null &&
          programLogs.logs.length > 0 &&
          NATIVE_PROGRAMS_MISSING_INVOKE_LOG.includes(programAddress)
        ) {
          logIndex++;
        } else {
          programLogs = undefined;
        }

        let badgeColor = 'white';
        if (programLogs) {
          badgeColor = programLogs.failed ? 'warning' : 'success';
        }

        return (
          <ProgramLogRow
            badgeColor={badgeColor}
            cluster={cluster}
            key={index}
            index={index}
            programId={programId}
            programLogs={programLogs}
            url={url}
          />
        );
      })}
    </TableCardBody>
  );
}

function ProgramLogRow({
  badgeColor,
  cluster,
  index,
  programId,
  programLogs,
  url,
}: {
  badgeColor: string;
  cluster: Cluster;
  index: number;
  programId: PublicKey;
  programLogs?: InstructionLogs;
  url: string;
}) {
  const pathname = usePathname();
  const anchorPath = useClusterPath({ pathname: `${pathname}#${getInstructionCardScrollAnchorId([index + 1])}` });
  return (
    <tr>
      <td>
        <Link className="flex items-center" href={anchorPath}>
          <span
            className={`mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              badgeColor === 'success'
                ? 'bg-green-100 text-green-800'
                : badgeColor === 'warning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-800 text-white'
            }`}
          >
            #{index + 1}
          </span>
          <span className="program-log-instruction-name">
            <ProgramName programId={programId} cluster={cluster} url={url} /> Instruction
          </span>
          <ChevronsUp className="c-pointer m-2" size={13} />
        </Link>
        {programLogs && (
          <div className="flex flex-col items-start p-2 font-mono text-sm">
            {programLogs.logs.map((log, key) => {
              return (
                <span key={key}>
                  <span className="text-muted-foreground">{log.prefix}</span>
                  <span className={`text-${log.style}`}>{log.text}</span>
                </span>
              );
            })}
          </div>
        )}
      </td>
    </tr>
  );
}
