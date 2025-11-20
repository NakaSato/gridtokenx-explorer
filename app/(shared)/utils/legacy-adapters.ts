/**
 * Legacy adapter layer for third-party libraries that require @solana/web3.js v1 Connection
 *
 * This module provides adapters for integrating @solana/kit-based code with third-party
 * libraries that haven't yet migrated to web3.js 2.0, including:
 * - Anchor programs (@coral-xyz/anchor)
 * - Serum markets (@project-serum/serum)
 * - Mango markets (@blockworks-foundation/mango-client)
 * - Metaplex NFTs (@metaplex-foundation/mpl-token-metadata)
 * - Name services (@bonfida/spl-name-service, @onsol/tldparser)
 *
 * Usage:
 * ```typescript
 * import { LegacyAdapter } from '@utils/legacy-adapters';
 * import { createRpc } from '@/app/(shared)/utils/rpc';
 *
 * const rpc = createRpc(url);
 * const adapter = new LegacyAdapter(url);
 *
 * // Use kit for modern calls
 * const balance = await rpc.getBalance(address).send();
 *
 * // Use adapter for legacy library calls
 * const program = await adapter.getAnchorProgram(programId, idl);
 * ```
 */

import { Address } from '@solana/kit';
import { Connection, PublicKey } from '@solana/web3.js';
import { createLegacyConnection, addressToPublicKey } from './rpc';

/**
 * Legacy adapter for third-party libraries requiring v1 Connection
 */
export class LegacyAdapter {
  private connection: Connection;
  private url: string;

  constructor(rpcUrl: string, commitment?: 'processed' | 'confirmed' | 'finalized') {
    this.url = rpcUrl;
    this.connection = createLegacyConnection(rpcUrl, commitment);
  }

  /**
   * Get the underlying Connection instance
   * Use this when you need to pass Connection to third-party libraries
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get the RPC URL
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * Convert Address to PublicKey for legacy library use
   */
  toPublicKey(address: Address | string): PublicKey {
    if (typeof address === 'string') {
      return new PublicKey(address);
    }
    return addressToPublicKey(address);
  }

  /**
   * Get Anchor Program instance
   *
   * Example:
   * ```typescript
   * import { Program, Idl } from '@coral-xyz/anchor';
   * const program = await adapter.getAnchorProgram<MyProgram>(programId, idl);
   * ```
   *
   * @param programId Program address
   * @param idl Program IDL
   * @returns Anchor Program instance
   */
  async getAnchorProgram<T = any>(programId: Address | string, idl: any): Promise<any> {
    // Note: Import Anchor dynamically to avoid SSR issues
    const { Program, AnchorProvider } = await import('@coral-xyz/anchor');
    const { Wallet: ServerWallet } = await import('@coral-xyz/anchor/dist/cjs/nodewallet');

    const provider = new AnchorProvider(this.connection, new ServerWallet(), {});
    const pubkey = this.toPublicKey(programId);
    return new Program(idl, pubkey, provider);
  }

  /**
   * Get Serum Market instance
   *
   * Example:
   * ```typescript
   * const market = await adapter.getSerumMarket(marketAddress);
   * const bids = await market.loadBids(connection);
   * ```
   *
   * Note: This is a client-side only operation due to Serum's dependencies
   *
   * @param marketAddress Market address
   * @returns Serum Market instance
   */
  async getSerumMarket(marketAddress: Address | string): Promise<any> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Serum markets can only be loaded in browser environment');
    }

    // Note: Import Serum dynamically to avoid SSR issues
    const { Market, MARKETS } = await import('@project-serum/serum');
    const pubkey = this.toPublicKey(marketAddress);

    return Market.load(this.connection, pubkey, {}, MARKETS[0].programId);
  }

  /**
   * Get Mango Market instance
   *
   * Example:
   * ```typescript
   * const mangoClient = await adapter.getMangoClient();
   * const group = await adapter.getMangoGroup(groupAddress);
   * ```
   *
   * Note: This is a client-side only operation due to Mango's dependencies
   *
   * @returns Mango Client instance
   */
  async getMangoClient(): Promise<any> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Mango client can only be used in browser environment');
    }

    // Note: Import Mango dynamically to avoid SSR issues
    const { MangoClient } = await import('@blockworks-foundation/mango-client');
    return new MangoClient(this.connection, MANGO_PROGRAM_ID);
  }

  /**
   * Get Metaplex NFT Metadata
   *
   * Example:
   * ```typescript
   * const metadata = await adapter.getMetaplexNFT(mintAddress);
   * console.log(metadata.data.name);
   * ```
   *
   * @param mintAddress NFT mint address
   * @returns Metadata instance
   */
  async getMetaplexNFT(mintAddress: Address | string): Promise<any> {
    // Note: Import Metaplex dynamically
    const { Metadata } = await import('@metaplex-foundation/mpl-token-metadata');
    const pubkey = this.toPublicKey(mintAddress);

    return Metadata.fromAccountAddress(this.connection, pubkey);
  }

  /**
   * Resolve SNS (Solana Name Service) domain to address
   *
   * Example:
   * ```typescript
   * const address = await adapter.resolveSNS('bonfida');
   * ```
   *
   * @param domain SNS domain name
   * @returns Resolved PublicKey or null
   */
  async resolveSNS(domain: string): Promise<PublicKey | null> {
    try {
      const { getDomainKeySync, NameRegistryState } = await import('@bonfida/spl-name-service');
      const { pubkey } = getDomainKeySync(domain);
      const owner = await NameRegistryState.retrieve(this.connection, pubkey);
      return owner.owner;
    } catch (error) {
      console.error('SNS resolution failed:', error);
      return null;
    }
  }

  /**
   * Resolve ANS (AllDomains Name Service) domain to address
   *
   * Example:
   * ```typescript
   * const address = await adapter.resolveANS('mydomain.sol');
   * ```
   *
   * @param domain ANS domain name
   * @returns Resolved PublicKey or null
   */
  async resolveANS(domain: string): Promise<PublicKey | null> {
    try {
      const { TldParser } = await import('@onsol/tldparser');
      const parser = new TldParser(this.connection);
      const owner = await parser.getOwnerFromDomainTld(domain);
      return owner ? new PublicKey(owner) : null;
    } catch (error) {
      console.error('ANS resolution failed:', error);
      return null;
    }
  }
}

// Mango Program ID constant
const MANGO_PROGRAM_ID = new PublicKey('mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68');

/**
 * Create a legacy adapter instance
 *
 * @param rpcUrl RPC endpoint URL
 * @param commitment Optional commitment level
 * @returns LegacyAdapter instance
 */
export function createLegacyAdapter(
  rpcUrl: string,
  commitment?: 'processed' | 'confirmed' | 'finalized',
): LegacyAdapter {
  return new LegacyAdapter(rpcUrl, commitment);
}
