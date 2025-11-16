import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';
import { Status, useFetchSupply, useSupply } from '@providers/supply';
import React from 'react';

export function SupplyCard() {
    const supply = useSupply();
    const fetchSupply = useFetchSupply();

    // Fetch supply on load
    React.useEffect(() => {
        if (supply === Status.Idle) fetchSupply();
    }, []); // eslint-disablline react-hooks/exhaustivdeps

    if (supply === Status.Disconnected) {
        return <ErrorCard text="Not connected to the cluster" />;
    }

    if (supply === Status.Idle || supply === Status.Connecting) return <LoadingCard />;

    if (typeof supply === 'string') {
        return <ErrorCard text={supply} retry={fetchSupply} />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Supply Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <TableCardBody>
                <tr>
                    <td className="w-full">Total Supply (SOL)</td>
                    <td className="lg:text-right">
                        <SolBalance lamports={supply.total} maximumFractionDigits={0} />
                    </td>
                </tr>

                <tr>
                    <td className="w-full">Circulating Supply (SOL)</td>
                    <td className="lg:text-right">
                        <SolBalance lamports={supply.circulating} maximumFractionDigits={0} />
                    </td>
                </tr>

                <tr>
                    <td className="w-full">Non-Circulating Supply (SOL)</td>
                    <td className="lg:text-right">
                        <SolBalance lamports={supply.nonCirculating} maximumFractionDigits={0} />
                    </td>
                </tr>
                </TableCardBody>
            </CardContent>
        </Card>
    );
}
