'use client';

import { FormattedIdl } from './formatters/FormattedIdl';
import { IdlDoc } from './IdlDoc';
import { IdlFieldsView } from './IdlFields';

export function IdlPdasView({ data }: { data: FormattedIdl['pdas'] }) {
  if (!data) return null;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="text-muted-foreground w-2">Name</th>
          <th className="text-muted-foreground">Seeds</th>
        </tr>
      </thead>
      <tbody className="list">
        {data.map(pda => (
          <tr key={pda.name}>
            <td>
              {pda.name}
              <IdlDoc docs={pda.docs} />
            </td>
            <td>
              <div className="d-flex flex-column flex-wrap items-center gap-2">
                {pda.seeds.map((seed, i) => (
                  <div key={i} className="d-flex">
                    {/*<IdlDocTooltip docs={seed.docs}>*/}
                    <IdlFieldsView fieldType={seed} />
                    {/*</IdlDocTooltip>*/}
                  </div>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
