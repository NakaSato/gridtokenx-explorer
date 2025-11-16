'use client';

import { FormattedIdl } from './formatters/FormattedIdl';
import { IdlDoc } from './IdlDoc';
import { IdlFieldsView } from './IdlFields';

export function IdlEventsView({ data }: { data: FormattedIdl['events'] }) {
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
        {data.map(event => (
          <tr key={event.name}>
            <td>
              {event.name}
              {!!event.docs && <IdlDoc docs={event.docs} />}
            </td>
            <td>{!!event.fieldType && <IdlFieldsView fieldType={event.fieldType} />}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
