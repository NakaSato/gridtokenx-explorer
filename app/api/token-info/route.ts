import { NextRequest, NextResponse } from 'next/server';

type TokenExtensions = {
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

export type FullLegacyTokenInfo = {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: TokenExtensions;
};

export type FullTokenInfo = FullLegacyTokenInfo & {
  readonly verified: boolean;
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

type FullLegacyTokenInfoList = {
  tokens: FullLegacyTokenInfo[];
};

type UtlApiResponse = {
  content: Token[];
};

function getChainId(cluster: string): number | undefined {
  if (cluster === 'mainnet-beta') return 101;
  else if (cluster === 'testnet') return 102;
  else if (cluster === 'devnet') return 103;
  else return undefined;
}

async function getFullLegacyTokenInfoUsingCdn(
  address: string,
  chainId: number,
): Promise<FullLegacyTokenInfo | undefined> {
  try {
    const tokenListResponse = await fetch(
      'https://cdn.jsdelivr.net/gh/solana-labs/token-list@latest/src/tokens/solana.tokenlist.json',
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    );
    
    if (!tokenListResponse.ok) {
      console.error(`Error fetching token list from CDN: ${tokenListResponse.status} ${tokenListResponse.statusText}`);
      return undefined;
    }
    
    const { tokens } = (await tokenListResponse.json()) as FullLegacyTokenInfoList;
    const tokenInfo = tokens.find(t => t.address === address && t.chainId === chainId);
    return tokenInfo;
  } catch (error) {
    console.error('Error fetching legacy token info:', error);
    return undefined;
  }
}

async function getTokenInfoFromUtlApi(address: string, chainId: number): Promise<Token | undefined> {
  try {
    // Request token info directly from UTL API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`https://token-list-api.solana.cloud/v1/mints?chainId=${chainId}`, {
      body: JSON.stringify({ addresses: [address] }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Error calling UTL API for address ${address} on chain ID ${chainId}. Status ${response.status}`);
      return undefined;
    }

    const fetchedData = (await response.json()) as UtlApiResponse;
    return fetchedData.content?.[0];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('UTL API request timeout');
    } else {
      console.error('Error fetching token info from UTL API:', error);
    }
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const cluster = searchParams.get('cluster') || 'mainnet-beta';

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  // Validate address format (basic Solana address validation)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return NextResponse.json(
      { error: 'Invalid Solana address format' },
      { status: 400 }
    );
  }

  try {
    // Check if address is redacted
    const badTokens = process.env.NEXT_PUBLIC_BAD_TOKENS?.split(',')
      .map(addr => addr.trim())
      .filter(Boolean) ?? [];
    const isRedacted = badTokens.includes(address);

    if (isRedacted) {
      return NextResponse.json(
        { data: null },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    const chainId = getChainId(cluster);
    if (!chainId) {
      return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    const [legacyCdnTokenInfo, utlApiTokenInfo] = await Promise.all([
      getFullLegacyTokenInfoUsingCdn(address, chainId),
      getTokenInfoFromUtlApi(address, chainId),
    ]);

    if (!utlApiTokenInfo) {
      const result = legacyCdnTokenInfo
        ? {
            ...legacyCdnTokenInfo,
            verified: true,
          }
        : null;
      return NextResponse.json(
        { data: result },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    // Merge the fields, prioritising the UTL API ones which are more up to date
    let tags: string[] = [];
    if (utlApiTokenInfo.tags) tags = Array.from(utlApiTokenInfo.tags);
    else if (legacyCdnTokenInfo?.tags) tags = legacyCdnTokenInfo.tags;

    const result: FullTokenInfo = {
      address: utlApiTokenInfo.address,
      chainId,
      decimals: utlApiTokenInfo.decimals ?? 0,
      extensions: legacyCdnTokenInfo?.extensions,
      logoURI: utlApiTokenInfo.logoURI ?? undefined,
      name: utlApiTokenInfo.name,
      symbol: utlApiTokenInfo.symbol,
      tags,
      verified: utlApiTokenInfo.verified ?? false,
    };

    return NextResponse.json(
      { data: result },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching token info:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch token info';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addresses, cluster = 'mainnet-beta' } = body;

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'Addresses array is required' },
        { status: 400 }
      );
    }

    // Validate addresses array
    if (addresses.length === 0) {
      return NextResponse.json(
        { error: 'Addresses array cannot be empty' },
        { status: 400 }
      );
    }

    if (addresses.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 addresses allowed per request' },
        { status: 400 }
      );
    }

    // Validate address format
    const invalidAddresses = addresses.filter(
      (addr: string) => typeof addr !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)
    );
    
    if (invalidAddresses.length > 0) {
      return NextResponse.json(
        { error: `Invalid address format: ${invalidAddresses.slice(0, 3).join(', ')}${invalidAddresses.length > 3 ? '...' : ''}` },
        { status: 400 }
      );
    }

    const chainId = getChainId(cluster);
    if (!chainId) {
      return NextResponse.json(
        { error: 'Invalid cluster' },
        { status: 400 }
      );
    }

    // Request token info directly from UTL API for multiple addresses
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for batch

    const response = await fetch(`https://token-list-api.solana.cloud/v1/mints?chainId=${chainId}`, {
      body: JSON.stringify({ addresses }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Error calling UTL API for multiple addresses on chain ID ${chainId}. Status ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch token infos from external API' },
        { status: response.status >= 500 ? 502 : 500 }
      );
    }

    const fetchedData = (await response.json()) as UtlApiResponse;
    return NextResponse.json(
      { data: fetchedData.content ?? [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('UTL API batch request timeout');
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }
    
    console.error('Error fetching multiple token infos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch token infos';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
