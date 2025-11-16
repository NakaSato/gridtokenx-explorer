'use client';

import { FormattedIdl } from './formatters/FormattedIdl';

export function IdlErrorsView({ data }: { data?: FormattedIdl['errors'] }) {
    if (!data) return null;

    return (
        <table className="w-full text-sm">
            <thead>
                <tr>
                    <th className="text-muted-foreground w-1">Code</th>
                    <th className="text-muted-foreground">Name</th>
                    <th className="text-muted-foreground">Message</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(err => (
                    <tr key={err.code}>
                        <td className="text-muted-foreground">{err.code}</td>
                        <td>{err.name}</td>
                        <td>{err.message}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
