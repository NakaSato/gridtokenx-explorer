import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

// Rexport types from the API route
export type FullTokenInfo = {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly verified: boolean;
  readonly extensions?: {
    readonly website?: string;
    readonly bridgeContract?: string;
    readonly assetContract?: string;
    readonly address?: string;
    readonly explorer?: string;
    readonly twitter?: string;
    readonly github?: string;
    readonly medium?: string;
    readonly tgann?: string;
    readonly tggroup?: string;
    readonly discord?: string;
    readonly serumV3Usdt?: string;
    readonly serumV3Usdc?: string;
    readonly coingeckoId?: string;
    readonly imageUrl?: string;
    readonly description?: string;
  };
};

export type FullLegacyTokenInfo = {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: FullTokenInfo['extensions'];
};

export type Token = {
  readonly address: string;
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly logoURI?: string;
  readonly tags?: Set<string>;
  readonly verified?: boolean;
};

export function getTokenInfoSwrKey(address: string, cluster: Cluster, connectionString: string) {
  return ['get-token-info', address, cluster, connectionString];
}

export async function getTokenInfo(
  address: PublicKey,
  cluster: Cluster,
  connectionString: string,
): Promise<Token | undefined> {
  try {
    const response = await fetch(
      `/api/token-info?address=${address.toBase58()}&cluster=${cluster}&connectionString=${encodeURIComponent(connectionString)}`,
    );
    if (!response.ok) {
      console.error('Error fetching token info:', response.statusText);
      return undefined;
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching token info:', error);
    return undefined;
  }
}

export async function getTokenInfoWithoutOnChainFallback(
  address: PublicKey,
  cluster: Cluster,
): Promise<Token | undefined> {
  try {
    const response = await fetch(`/api/token-info?address=${address.toBase58()}&cluster=${cluster}`);
    if (!response.ok) {
      console.error('Error fetching token info without on-chain fallback:', response.statusText);
      return undefined;
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching token info without on-chain fallback:', error);
    return undefined;
  }
}

export function isRedactedTokenAddress(address: string): boolean {
  return (
    process.env.NEXT_PUBLIC_BAD_TOKENS?.split(',')
      .map(addr => addr.trim())
      .includes(address) ?? false
  );
}

/**
 * Get the full token info from a CDN with the legacy token list
 * The UTL SDK only returns the most common fields, we sometimes need eg extensions
 * @param address Public key of the token
 * @param cluster Cluster to fetch the token info for
 */
export async function getFullTokenInfo(
  address: PublicKey,
  cluster: Cluster,
  connectionString: string,
): Promise<FullTokenInfo | undefined> {
  try {
    const response = await fetch(
      `/api/token-info?address=${address.toBase58()}&cluster=${cluster}&connectionString=${encodeURIComponent(connectionString)}`,
    );
    if (!response.ok) {
      console.error('Error fetching full token info:', response.statusText);
      return undefined;
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching full token info:', error);
    return undefined;
  }
}

export async function getTokenInfos(
  addresses: PublicKey[],
  cluster: Cluster,
  connectionString: string,
): Promise<Token[] | undefined> {
  try {
    const response = await fetch('/api/token-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addresses: addresses.map(addr => addr.toBase58()),
        cluster,
        connectionString,
      }),
    });
    if (!response.ok) {
      console.error('Error fetching multiple token infos:', response.statusText);
      return undefined;
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching multiple token infos:', error);
    return undefined;
  }
}

export function getCurrentTokenScaledUiAmountMultiplier(extensions: Array<TokenExtension> | undefined): string {
  const scaledUiAmountConfig = extensions?.find(extension => extension.extension === 'scaledUiAmountConfig');
  if (!scaledUiAmountConfig) {
    return '1';
  }
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return currentTimestamp >= scaledUiAmountConfig.state.newMultiplierEffectiveTimestamp
    ? scaledUiAmountConfig.state.newMultiplier
    : scaledUiAmountConfig.state.multiplier;
}
