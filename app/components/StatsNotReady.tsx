import { Button } from '@components/shared/ui/button';
import { useCluster } from '@providers/cluster';
import { useStatsProvider } from '@providers/stats/solanaClusterStats';
import React from 'react';
import { RefreshCw } from 'react-feather';

const CLUSTER_STATS_TIMEOUT = 30000; // Increased to 30 seconds to accommodate slower RPC endpoints

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
                <p className="text-muted-foreground mb-3">There was a problem loading cluster stats.</p>
                <Button variant="outline" size="sm" onClick={() => retry()}>
                    <RefreshCw size={14} />
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 text-center">
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-text-top"></span>
            Loading
        </div>
    );
}
