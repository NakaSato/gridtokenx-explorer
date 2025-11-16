'use client';

import { FormattedIdl, InstructionAccountData } from './formatters/FormattedIdl';
import { IdlDoc, IdlDocTooltip } from './IdlDoc';
import { IdlStructFieldsView } from './IdlFields';

type IxData = FormattedIdl['instructions'];
type IxAccountsData = NonNullable<FormattedIdl['instructions']>[0]['accounts'];
type IxArgsData = NonNullable<FormattedIdl['instructions']>[0]['args'];

export function IdlInstructionsView({ data }: { data: IxData }) {
  if (!data) return null;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="text-muted-foreground w-2">Name</th>
          <th className="text-muted-foreground">Arguments</th>
          <th className="text-muted-foreground">Accounts</th>
        </tr>
      </thead>
      <tbody className="list">
        {data.map(ix => (
          <tr key={ix.name}>
            <td>
              {ix.name}
              <IdlDoc docs={ix.docs} />
            </td>
            <td>
              <IdlInstructionArguments data={ix.args} />
            </td>
            <td>
              <IdlInstructionAccounts data={ix.accounts} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IdlInstructionArguments({ data }: { data: IxArgsData }) {
  if (!data.length) return <>&mdash;</>;
  return <IdlStructFieldsView fields={data} />;
}

function IdlInstructionAccounts({ data }: { data: IxAccountsData }) {
  return (
    <div className="flex flex-col flex-wrap items-start justify-start gap-1">
      {data.map(acc => {
        // nested accs
        if ('accounts' in acc) {
          return (
            <div key={acc.name}>
              <p className="text-muted-foreground mb-2">{acc.name}</p>
              <div className="bg-neutral-800 px-3 py-2">
                <InstructionAccounts accounts={acc.accounts} />
              </div>
            </div>
          );
        }
        return (
          <IdlInstructionAccount
            key={acc.name}
            docs={acc.docs}
            name={acc.name}
            isWritable={acc.writable}
            isSigner={acc.signer}
            isPda={acc.pda}
            isOptional={acc.optional}
          />
        );
      })}
    </div>
  );
}

function InstructionAccounts({ accounts }: { accounts: InstructionAccountData[] }) {
  return (
    <div className="flex flex-col flex-wrap items-start justify-start gap-1">
      {accounts.map(({ docs, name, writable, signer, pda, optional }) => (
        <IdlInstructionAccount
          key={name}
          docs={docs}
          name={name}
          isWritable={writable}
          isSigner={signer}
          isPda={pda}
          isOptional={optional}
        />
      ))}
    </div>
  );
}

function IdlInstructionAccount({
  docs,
  name,
  isWritable,
  isSigner,
  isPda,
  isOptional,
}: {
  docs: string[];
  name: string;
  isWritable?: boolean;
  isSigner?: boolean;
  isPda?: boolean;
  isOptional?: boolean;
}) {
  return (
    <IdlDocTooltip key={name} docs={docs}>
      <div className="inline-flex items-center gap-2">
        <span>{name}</span>
        {!!isWritable && <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">isMut</span>}
        {!!isSigner && (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            isSigner
          </span>
        )}
        {!!isPda && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
            pda
          </span>
        )}
        {!!isOptional && (
          <span className="inline-flex items-center rounded-full bg-gray-500 px-2 py-0.5 text-xs font-medium text-white">
            optional
          </span>
        )}
      </div>
    </IdlDocTooltip>
  );
}
