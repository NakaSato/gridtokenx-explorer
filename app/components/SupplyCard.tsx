import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
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
        <div className="bg-card border rounded-lg shadow-sm">
            {renderHeader()}

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
        </div>
    );
}

const renderHeader = () => {
    return (
        <div className="px-6 py-4 border-b">
            <div className="flex flex-wrap -mx-2 items-center">
                <div className="flex-1 px-2">
                    <h4 className="text-lg font-semibold">Supply Overview</h4>
                </div>
            </div>
        </div>
    );
};
