import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

import { Address } from '@/app/components/common/AddressWrapper';
import { isFeatureActivated } from '@/app/features/feature-gate';
import { useCluster } from '@/app/providers/cluster';

import { Cluster, clusterName } from '../cluster';
import FEATURES from './featureGates.json';
import { FeatureInfoType } from './types';

export function UpcomingFeatures() {
    const { cluster } = useCluster();

    // Don't show anything for localnet
    if (cluster === Cluster.Custom) {
        return null;
    }

    const filteredFeatures = (FEATURES as FeatureInfoType[])
        .filter((feature: FeatureInfoType) => {
            switch (cluster) {
                case Cluster.MainnetBeta:
                    // Show features activated on devnet and testnet
                    return feature.devnet_activation_epoch !== null && feature.testnet_activation_epoch !== null;
                case Cluster.Devnet:
                    // Show features activated on testnet, mark if already activated on devnet
                    return feature.testnet_activation_epoch !== null;
                case Cluster.Testnet:
                    // Only show features not yet activated on testnet
                    return feature.testnet_activation_epoch === null;
                default:
                    return false;
            }
        })
        .filter((feature: FeatureInfoType) => {
            return !isFeatureActivated(feature, cluster);
        });

    if (filteredFeatures.length === 0) {
        return (
            <div className="bg-card rounded-lg border shadow-sm">
                <div className="p-6">
                    <div className="text-center">No upcoming features for {clusterName(cluster)}</div>
                </div>
            </div>
        );
    }

    return (
        <FeaturesTable
            header={
                <>
                    <span className="m2">🚀</span>
                    Upcoming {clusterName(cluster)} Features
                </>
            }
            features={filteredFeatures.filter(feature => !feature.mainnet_activation_epoch)}
            cluster={cluster}
        />
    );
}

function FeaturesTable({
    header,
    features,
    cluster,
}: {
    header: React.ReactNode;
    features: FeatureInfoType[];
    cluster: Cluster;
}) {
    return (
        <div className="bg-card rounded-lg border shadow-sm">
            <div className="border-b px-6 py-4">
                <h4 className="text-lg font-semibold">{header}</h4>
            </div>
            <div className="tablresponsive small-headers">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Feature</th>
                            <th>Activation Epochs</th>
                            <th>Feature Gate</th>
                            <th>SIMD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {features.map(feature => (
                            <tr key={feature.key}>
                                <td>
                                    <div className="mb-2 flex items-center">
                                        <p className="m3 text-decoration-underline fs-sm mb-0">{feature.title}</p>
                                        {cluster === Cluster.MainnetBeta && feature.mainnet_activation_epoch && (
                                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                                                Active on Mainnet
                                            </span>
                                        )}
                                        {cluster === Cluster.Devnet && feature.devnet_activation_epoch && (
                                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                                                Active on Devnet
                                            </span>
                                        )}
                                        {cluster === Cluster.Testnet && feature.testnet_activation_epoch && (
                                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                                                Active on Testnet
                                            </span>
                                        )}
                                    </div>
                                    <p className="fs-sm mb-0">{feature.description}</p>
                                </td>
                                <td>
                                    <div className="fs-sm flex flex-col">
                                        {feature.mainnet_activation_epoch && (
                                            <Link
                                                href={`/epoch/${feature.mainnet_activation_epoch}?cluster=mainnet`}
                                                className="epoch-link mb-1"
                                            >
                                                Mainnet: {feature.mainnet_activation_epoch}
                                            </Link>
                                        )}
                                        {feature.devnet_activation_epoch && (
                                            <Link
                                                href={`/epoch/${feature.devnet_activation_epoch}?cluster=devnet`}
                                                className="epoch-link mb-1"
                                            >
                                                Devnet: {feature.devnet_activation_epoch}
                                            </Link>
                                        )}
                                        {feature.testnet_activation_epoch && (
                                            <Link
                                                href={`/epoch/${feature.testnet_activation_epoch}?cluster=testnet`}
                                                className="epoch-link"
                                            >
                                                Testnet: {feature.testnet_activation_epoch}
                                            </Link>
                                        )}
                                    </div>
                                </td>
                                <td className="fs-sm">
                                    <Address
                                        pubkey={new PublicKey(feature.key ?? '')}
                                        link
                                        truncateChars={feature.simds[0] ? 12 : 20}
                                    />
                                </td>
                                <td>
                                    {feature.simds.map((simd, index) => (
                                        <a
                                            key={index}
                                            href={feature.simd_link[index]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="border-primary text-primary hover:bg-primary rounded-md border px-3 py-1.5 text-sm hover:text-white"
                                        >
                                            SIMD {simd.replace(/^0+/, '')}
                                        </a>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
