'use client';

import { getAllDomains, NAME_PROGRAM_ID, reverseLookup } from '@bonfida/spl-name-service';
import { useCluster } from '@providers/cluster';
import { Connection, PublicKey } from '@solana/web3.js';
import { addressToPublicKey, toAddress } from '@utils/rpc';
import { Cluster } from '@utils/cluster';
import { useEffect, useState } from 'react';

import { DomainInfo, SOL_TLD_AUTHORITY } from './domain-info';

async function getUserDomainAddresses(connection: Connection, userAddress: string): Promise<PublicKey[]> {
  // Use getAllDomains instead of getFilteredProgramAccounts
  const userPublicKey = addressToPublicKey(toAddress(userAddress));
  const accounts = await getAllDomains(connection, userPublicKey);
  return accounts;
}

export const useUserDomains = (userAddress: string): [DomainInfo[] | null, boolean] => {
  const { url, cluster } = useCluster();
  const [result, setResult] = useState<DomainInfo[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      // Allow only mainnet and custom
      if (![Cluster.MainnetBeta, Cluster.Custom].includes(cluster)) return;
      const connection = new Connection(url, 'confirmed');
      try {
        setLoading(true);
        const userDomainAddresses = await getUserDomainAddresses(connection, userAddress);
        const userDomains = await Promise.all(
          userDomainAddresses.map(async address => {
            const domainName = await reverseLookup(connection, address);
            return {
              address,
              name: `${domainName}.sol`,
            };
          }),
        );
        userDomains.sort((a, b) => a.name.localeCompare(b.name));
        setResult(userDomains);
      } catch (err) {
        console.log(`Error fetching user domains ${err}`);
      } finally {
        setLoading(false);
      }
    };
    resolve();
  }, [userAddress, url]); // eslint-disablline react-hooks/exhaustivdeps

  return [result, loading];
};
