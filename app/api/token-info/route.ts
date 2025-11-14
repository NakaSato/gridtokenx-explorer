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
    chainId: number
): Promise<FullLegacyTokenInfo | undefined> {
    try {
        const tokenListResponse = await fetch(
            'https://cdn.jsdelivr.net/gh/solana-labs/token-list@latest/src/tokens/solana.tokenlist.json'
        );
        if (tokenListResponse.status >= 400) {
            console.error(new Error('Error fetching token list from CDN'));
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

async function getTokenInfoFromUtlApi(
    address: string,
    chainId: number
): Promise<Token | undefined> {
    try {
        // Request token info directly from UTL API
        const response = await fetch(`https://token-list-api.solana.cloud/v1/mints?chainId=${chainId}`, {
            body: JSON.stringify({ addresses: [address] }),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
        });

        if (response.status >= 400) {
            console.error(`Error calling UTL API for address ${address} on chain ID ${chainId}. Status ${response.status}`);
            return undefined;
        }

        const fetchedData = (await response.json()) as UtlApiResponse;
        return fetchedData.content[0];
    } catch (error) {
        console.error('Error fetching token info from UTL API:', error);
        return undefined;
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const cluster = searchParams.get('cluster') || 'mainnet-beta';

    if (!address) {
        return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    try {
        // Check if address is redacted
        const isRedacted = process.env.NEXT_PUBLIC_BAD_TOKENS?.split(',')
            .map(addr => addr.trim())
            .includes(address) ?? false;

        if (isRedacted) {
            return NextResponse.json({ data: null });
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
            return NextResponse.json({ data: result });
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

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching token info:', error);
        return NextResponse.json({ error: 'Failed to fetch token info' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { addresses, cluster = 'mainnet-beta' } = body;

        if (!addresses || !Array.isArray(addresses)) {
            return NextResponse.json({ error: 'Addresses array is required' }, { status: 400 });
        }

        const chainId = getChainId(cluster);
        if (!chainId) {
            return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
        }

        // Request token info directly from UTL API for multiple addresses
        const response = await fetch(`https://token-list-api.solana.cloud/v1/mints?chainId=${chainId}`, {
            body: JSON.stringify({ addresses }),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
        });

        if (response.status >= 400) {
            console.error(`Error calling UTL API for multiple addresses on chain ID ${chainId}. Status ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch token infos' }, { status: 500 });
        }

        const fetchedData = (await response.json()) as UtlApiResponse;
        return NextResponse.json({ data: fetchedData.content });
    } catch (error) {
        console.error('Error fetching multiple token infos:', error);
        return NextResponse.json({ error: 'Failed to fetch token infos' }, { status: 500 });
    }
}
