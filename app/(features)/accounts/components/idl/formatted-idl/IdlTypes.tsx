'use client';

import { FormattedIdl } from './formatters/FormattedIdl';
import { IdlDoc } from './IdlDoc';
import { IdlFieldsView } from './IdlFields';

export function IdlTypesView({ data }: { data: FormattedIdl['types'] }) {
  if (!data) return null;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="text-muted-foreground w-2">Name</th>
          <th className="text-muted-foreground">Fields</th>
        </tr>
      </thead>
      <tbody className="list">
        {data.map(typeItem => (
          <tr key={typeItem.name}>
            <td>
              <span className="flex items-center gap-2">
                <i className="text-muted-foreground">{typeItem.fieldType?.kind}</i>
                {typeItem.name}
              </span>
              <IdlDoc docs={typeItem.docs} />
            </td>
            <td>{!!typeItem.fieldType && <IdlFieldsView fieldType={typeItem.fieldType} />}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
