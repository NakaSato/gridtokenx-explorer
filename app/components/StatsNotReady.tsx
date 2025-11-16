import { useCluster } from '@providers/cluster';
import { useStatsProvider } from '@providers/stats/solanaClusterStats';
import React from 'react';
import { RefreshCw } from 'react-feather';

const CLUSTER_STATS_TIMEOUT = 15000; // Increased to 15 seconds to allow for slower network/RPC responses

export function StatsNotReady({ error }: { error: boolean }) {
    const { setTimedOut, retry, active } = useStatsProvider();
    const { cluster } = useCluster();

    React.useEffect(() => {
        let timedOut: NodeJS.Timeout;
        if (!error) {
            timedOut = setTimeout(setTimedOut, CLUSTER_STATS_TIMEOUT);
        }
        return () => {
            if (timedOut) {
                clearTimeout(timedOut);
            }
        };
    }, [setTimedOut, cluster, error]);

    if (error || !active) {
        return (
            <div className="p-6 text-center">
                There was a problem loading cluster stats.{' '}
                <button
                    className="bg-white text-gray-800 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-100 inline-flex items-center gap-1.5"
                    onClick={() => {
                        retry();
                    }}
                >
                    <RefreshCw className="align-text-top" size={13} />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 text-center">
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin align-text-top mr-2"></span>
            Loading
        </div>
    );
}
