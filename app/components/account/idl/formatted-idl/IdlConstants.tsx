'use client';

import { FormattedIdl } from './formatters/FormattedIdl';

export function IdlConstantsView({ data }: { data?: FormattedIdl['constants'] }) {
    if (!data) return null;

    return (
        <table className="w-full text-sm">
            <thead>
                <tr>
                    <th className="text-muted-foreground w-1">Name</th>
                    <th className="text-muted-foreground">Value</th>
                </tr>
            </thead>
            <tbody className="list">
                {data.map(constant => (
                    <tr key={constant.name}>
                        <td>{constant.name}</td>
                        <td>
                            <div className="flex items-center gap-2">
                                <span>{JSON.stringify(constant.value, undefined, 2)}:</span>
                                <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                                    {constant.type}
                                </span>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
