export enum ClusterStatus {
  Connected,
  Connecting,
  Failure,
}

export enum Cluster {
  MainnetBeta,
  Testnet,
  Devnet,
  Localnet,
  Custom,
}

export const CLUSTERS = [Cluster.MainnetBeta, Cluster.Testnet, Cluster.Devnet, Cluster.Localnet, Cluster.Custom];

export function clusterSlug(cluster: Cluster): string {
  switch (cluster) {
    case Cluster.MainnetBeta:
      return 'mainnet';
    case Cluster.Testnet:
      return 'testnet';
    case Cluster.Devnet:
      return 'devnet';
    case Cluster.Localnet:
      return 'localnet';
    case Cluster.Custom:
      return 'custom';
  }
}

export function clusterName(cluster: Cluster): string {
  switch (cluster) {
    case Cluster.MainnetBeta:
      return 'Mainnet Beta';
    case Cluster.Testnet:
      return 'Testnet';
    case Cluster.Devnet:
      return 'Devnet';
    case Cluster.Localnet:
      return 'Localnet (Anchor)';
    case Cluster.Custom:
      return 'Custom';
  }
}

export const MAINNET_BETA_URL = 'https://api.mainnet-beta.solana.com';
export const TESTNET_URL = 'https://api.testnet.solana.com';
export const DEVNET_URL = 'https://api.devnet.solana.com';
export const LOCAL_URL = 'http://localhost:8899';

const modifyUrl = (url: string): string => {
  // Only modify URL for production non-localhost environments
  // This check should not rely on window object to avoid SSR/client mismatch
  return url;
};

export function clusterUrl(cluster: Cluster, customUrl: string): string {
  // Support local development from .env.local
  const localRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_HTTP;

  switch (cluster) {
    case Cluster.Devnet:
      return process.env.NEXT_PUBLIC_DEVNET_RPC_URL ?? modifyUrl(DEVNET_URL);
    case Cluster.MainnetBeta:
      return process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? modifyUrl(MAINNET_BETA_URL);
    case Cluster.Testnet:
      return process.env.NEXT_PUBLIC_TESTNET_RPC_URL ?? modifyUrl(TESTNET_URL);
    case Cluster.Localnet:
      // Default Anchor localnet RPC
      return process.env.NEXT_PUBLIC_LOCALNET_RPC_URL ?? LOCAL_URL;
    case Cluster.Custom:
      // Use custom URL, or fall back to local RPC from env, or default local URL
      return customUrl || localRpcUrl || LOCAL_URL;
  }
}

export function serverClusterUrl(cluster: Cluster, customUrl: string): string {
  // Support local development from .env.local (server-side)
  const localRpcUrl = process.env.SOLANA_RPC_HTTP || process.env.NEXT_PUBLIC_SOLANA_RPC_HTTP;

  switch (cluster) {
    case Cluster.Devnet:
      return process.env.DEVNET_RPC_URL ?? modifyUrl(DEVNET_URL);
    case Cluster.MainnetBeta:
      return process.env.MAINNET_RPC_URL ?? modifyUrl(MAINNET_BETA_URL);
    case Cluster.Testnet:
      return process.env.TESTNET_RPC_URL ?? modifyUrl(TESTNET_URL);
    case Cluster.Localnet:
      // Default Anchor localnet RPC
      return process.env.LOCALNET_RPC_URL ?? process.env.NEXT_PUBLIC_LOCALNET_RPC_URL ?? LOCAL_URL;
    case Cluster.Custom:
      // Use custom URL, or fall back to local RPC from env, or default local URL
      return customUrl || localRpcUrl || LOCAL_URL;
  }
}

export const DEFAULT_CLUSTER = (function () {
  const envCluster = process.env.NEXT_PUBLIC_DEFAULT_CLUSTER;
  switch (envCluster) {
    case 'mainnet-beta': return Cluster.MainnetBeta;
    case 'testnet': return Cluster.Testnet;
    case 'devnet': return Cluster.Devnet;
    case 'localnet': return Cluster.Localnet;
    case 'custom': return Cluster.Custom;
    default: return Cluster.MainnetBeta;
  }
})();
