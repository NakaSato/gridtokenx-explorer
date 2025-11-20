import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

import { Address } from '@/app/(shared)/components/AddressWrapper';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { isFeatureActivated } from '@/app/features/feature-gate';
import { useCluster } from '@/app/(core)/providers/cluster';

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
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">No upcoming features for {clusterName(cluster)}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <FeaturesTable
      header={<>Upcoming {clusterName(cluster)} Features</>}
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
    <Card>
      <CardHeader>
        <CardTitle>{header}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-muted-foreground p-4 text-left">Feature</th>
                <th className="text-muted-foreground p-4 text-left">Activation Epochs</th>
                <th className="text-muted-foreground p-4 text-left">Feature Gate</th>
                <th className="text-muted-foreground p-4 text-left">SIMD</th>
              </tr>
            </thead>
            <tbody>
              {features.map(feature => (
                <tr key={feature.key} className="border-b last:border-b-0">
                  <td className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <p className="text-sm font-medium underline">{feature.title}</p>
                      {cluster === Cluster.MainnetBeta && feature.mainnet_activation_epoch && (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active on Mainnet
                        </Badge>
                      )}
                      {cluster === Cluster.Devnet && feature.devnet_activation_epoch && (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active on Devnet
                        </Badge>
                      )}
                      {cluster === Cluster.Testnet && feature.testnet_activation_epoch && (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active on Testnet
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-sm">
                      {feature.mainnet_activation_epoch && (
                        <Link
                          href={`/epoch/${feature.mainnet_activation_epoch}?cluster=mainnet`}
                          className="text-primary hover:underline"
                        >
                          Mainnet: {feature.mainnet_activation_epoch}
                        </Link>
                      )}
                      {feature.devnet_activation_epoch && (
                        <Link
                          href={`/epoch/${feature.devnet_activation_epoch}?cluster=devnet`}
                          className="text-primary hover:underline"
                        >
                          Devnet: {feature.devnet_activation_epoch}
                        </Link>
                      )}
                      {feature.testnet_activation_epoch && (
                        <Link
                          href={`/epoch/${feature.testnet_activation_epoch}?cluster=testnet`}
                          className="text-primary hover:underline"
                        >
                          Testnet: {feature.testnet_activation_epoch}
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <Address
                      pubkey={new PublicKey(feature.key ?? '')}
                      link
                      truncateChars={feature.simds[0] ? 12 : 20}
                    />
                  </td>
                  <td className="p-4">
                    {feature.simds.map((simd, index) => (
                      <Button key={index} variant="outline" size="sm" asChild>
                        <a href={feature.simd_link[index]} target="_blank" rel="noopener noreferrer">
                          SIMD {simd.replace(/^0+/, '')}
                        </a>
                      </Button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
