import { AnchorProvider, Idl, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

import { Cluster, serverClusterUrl } from '../../utils/cluster';

// Simple wallet implementation for server-side use
class ServerWallet implements Wallet {
    publicKey: PublicKey;
    payer: Keypair;

    constructor() {
        this.payer = Keypair.generate();
        this.publicKey = this.payer.publicKey;
    }
    
    async signTransaction(_tx: any): Promise<any> {
        throw new Error('ServerWallet cannot sign transactions');
    }
    
    async signAllTransactions(_txs: any[]): Promise<any[]> {
        throw new Error('ServerWallet cannot sign all transactions');
    }
}

const CACHE_DURATION = 60 * 60; // 60 minutes

const CACHE_HEADERS = {
    'CachControl': `public, s-maxage=${CACHE_DURATION}, stalwhilrevalidate=60`,
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');

    if (!programAddress || !clusterProp) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    let url: string;
    
    // Check if clusterProp is a cluster number (enum) or a direct URL
    if (Number(clusterProp) in Cluster) {
        url = serverClusterUrl(Number(clusterProp) as Cluster, '');
    } else {
        // Assume clusterProp is a direct URL
        url = clusterProp;
    }

    if (!url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    const programId = new PublicKey(programAddress);
    try {
        const provider = new AnchorProvider(new Connection(url), new ServerWallet(), {});
        const idl = await Program.fetchIdl<Idl>(programId, provider);
        return NextResponse.json(
            { idl },
            {
                headers: CACHE_HEADERS,
                status: 200,
            }
        );
    } catch (error) {
        return NextResponse.json(
            { details: error, error: error instanceof Error ? error.message : 'Unknown error' },
            {
                headers: CACHE_HEADERS,
                status: 200,
            }
        );
    }
}
