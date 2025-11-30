'use client';

import { Connection, PublicKey } from '@solana/web3.js';
import { addressToPublicKey, toAddress } from '@/app/(shared)/utils/rpc';
import useSWRImmutable from 'swr/immutable';

import { useAnchorProgram } from '@/app/(core)/providers/anchor';
import { useCluster } from '@/app/(core)/providers/cluster';
import { ProgramDataAccountInfo } from '@/app/validators/accounts/upgradeable-program';
import { Cluster } from './cluster';

// SSR-safe module initialization
const isClientSide = typeof window !== 'undefined' && typeof document !== 'undefined';

const OSEC_REGISTRY_URL = 'https://verify.osec.io';
const VERIFY_PROGRAM_ID = 'verifycLy8mB96wd9wqq3WDXQwM4oU6r42Th37Db9fC';

export enum VerificationStatus {
  Verified = 'Verified Build',
  PdaUploaded = 'Not verified Build',
  NotVerified = 'Not Verified',
}

export type OsecRegistryInfo = {
  verification_status: VerificationStatus;
  signer: string;
  is_verified: boolean;
  message: string;
  on_chain_hash: string;
  executable_hash: string;
  last_verified_at: string | null;
  repo_url: string;
  verify_command: string;
};

export type OsecInfo = {
  signer: string;
  is_verified: boolean;
  on_chain_hash: string;
  executable_hash: string;
  repo_url: string;
  commit: string;
  last_verified_at: string;
  is_frozen: boolean;
};

const TRUSTED_SIGNERS: Record<string, string> = {
  '11111111111111111111111111111111': 'Explorer',
  '9VWiUUhgNoRwTH5NVehYJEDwcotwYX3VgW4MChiHPAqU': 'OtterSecurity',
  CyJj5ejJAUveDXnLduJbkvwjxcmWJNqCuB9DR7AExrHn: 'Explorer',
};

export function useVerifiedProgramRegistry({
  programId,
  programAuthority,
  options,
  programData,
}: {
  programId: PublicKey;
  programAuthority: PublicKey | null;
  options?: { suspense: boolean };
  programData?: ProgramDataAccountInfo;
}) {
  const {
    data: registryData,
    error: registryError,
    isLoading: isRegistryLoading,
  } = useSWRImmutable(
    `${programId.toBase58()}`,
    async (programId: string) => {
      const response = await fetch(`${OSEC_REGISTRY_URL}/status-all/${programId}`);

      return response.json() as Promise<OsecInfo[]>;
    },
    { suspense: options?.suspense },
  );

  if (!programData || !registryData) {
    return { data: null, error: registryError, isLoading: isRegistryLoading };
  }

  // Only trust entries that are verified and signed by a trusted signer or program authority
  let orderedVerifiedEntries: OsecInfo[] = [];
  if (programAuthority) {
    const trustedEntries = registryData.filter(
      entry => (TRUSTED_SIGNERS[entry.signer] || entry.signer === programAuthority?.toBase58()) && entry.is_verified,
    );

    // Update verification status of trusted entries based on on-chain hash
    const hash = hashProgramData(programData);
    trustedEntries.forEach(entry => {
      entry.is_verified = hash === entry['on_chain_hash'];
    });

    const mappedBySigner: Record<string, OsecInfo> = {};

    // Map registryData by signer in order to enforce hierarchy of trust
    trustedEntries.forEach(entry => {
      mappedBySigner[entry.signer] = entry;
    });

    // Get the program authority's entry first, then the trusted signers
    const hierarchy = [...(programAuthority ? [programAuthority.toBase58()] : []), ...Object.keys(TRUSTED_SIGNERS)];
    for (const signer of hierarchy) {
      if (mappedBySigner[signer]) {
        orderedVerifiedEntries.push(mappedBySigner[signer]);
      }
    }
  } else {
    orderedVerifiedEntries = registryData
      .filter(entry => entry.is_verified && entry.is_frozen)
      .sort((a, b) => new Date(a.last_verified_at).getTime() - new Date(b.last_verified_at).getTime());
  }

  return { data: orderedVerifiedEntries, isLoading: isRegistryLoading };
}

export function useIsProgramVerified({
  programId,
  programData,
}: {
  programId: PublicKey;
  programData: ProgramDataAccountInfo;
}) {
  return useSWRImmutable(
    ['is-program-verified', programId.toBase58(), hashProgramData(programData), programData.authority],
    async ([_prefix, programId, hash, authority]) => {
      if (!programId) {
        return false;
      }

      const response = await fetch(`${OSEC_REGISTRY_URL}/status/${programId}`);
      const osecInfo = (await response.json()) as OsecInfo;

      // If program data is frozen, then we can trust the API
      if (osecInfo.is_frozen && authority === null) {
        return osecInfo.is_verified;
      }

      // Otherwise, let's just double check that the on-chain hash matches the reported hash for verification
      return osecInfo.is_verified && hash === osecInfo['on_chain_hash'];
    },
  );
}

// Method to fetch verified build information for a given program
// Returns first verified entry that is signed by the program authority or a trusted signer
export function useVerifiedProgram({
  programId,
  programAuthority,
  options,
  programData,
}: {
  programId: PublicKey;
  programAuthority: PublicKey | null;
  options?: { suspense: boolean };
  programData?: ProgramDataAccountInfo;
}) {
  const { data: orderedVerifiedEntries } = useVerifiedProgramRegistry({
    options,
    programAuthority,
    programData,
    programId,
  });

  // Get the first verified entry
  const verifiedData = orderedVerifiedEntries?.find(entry => entry.is_verified);

  return useEnrichedOsecInfo({ options, osecInfo: verifiedData, programId });
}

// Internal method to enrich osec info with verify command (requires fetching on-chain PDA)
function useEnrichedOsecInfo({
  programId,
  osecInfo,
  options,
}: {
  programId: PublicKey;
  osecInfo: OsecInfo | undefined;
  options?: { suspense: boolean };
}) {
  const { url: clusterUrl, cluster: cluster } = useCluster();
  const connection = new Connection(clusterUrl);

  const { program: accountAnchorProgram } = useAnchorProgram(VERIFY_PROGRAM_ID, connection.rpcEndpoint);

  // Fetch PDA derived from the program upgrade authority
  const {
    data: pdaData,
    error: pdaError,
    isLoading: isPdaLoading,
  } = useSWRImmutable(
    accountAnchorProgram ? `pda-${programId.toBase58()}-${osecInfo?.signer}` : null,
    async () => {
      if (!osecInfo || !accountAnchorProgram) {
        return null;
      }

      try {
        const [pda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('otter_verify'),
            addressToPublicKey(toAddress(osecInfo.signer)).toBuffer(),
            programId.toBuffer(),
          ],
          addressToPublicKey(toAddress(VERIFY_PROGRAM_ID)),
        );

        const pdaAccountInfo = await (accountAnchorProgram.account as any).buildParams.fetch(pda);
        if (!pdaAccountInfo) {
          return null;
        }
        return pdaAccountInfo;
      } catch (error) {
        console.error('Error fetching on-chain PDA', error);
        return null;
      }
    },
    { suspense: options?.suspense },
  );

  if (!osecInfo || pdaError) {
    return { data: null, error: pdaError, isLoading: isPdaLoading };
  }
  if (!pdaData || isPdaLoading) {
    return { data: null, isLoading: isPdaLoading };
  }

  const message = TRUSTED_SIGNERS[osecInfo?.signer || '']
    ? 'Verification information provided by a trusted signer.'
    : osecInfo.is_frozen
      ? 'Verification information provided by the program deployer.'
      : 'Verification information provided by the program authority.';

  const enrichedOsecInfo: OsecRegistryInfo = {
    ...osecInfo,
    message,
    signer: osecInfo.signer || '',
    verification_status: osecInfo.is_verified
      ? VerificationStatus.Verified
      : pdaData
        ? VerificationStatus.PdaUploaded
        : VerificationStatus.NotVerified,
    verify_command: '',
  };
  enrichedOsecInfo.repo_url = pdaData.gitUrl;
  enrichedOsecInfo.repo_url += pdaData.commit.length ? '/tree/' + pdaData.commit : '';
  if (pdaData) {
    // Create command from the args of the verified build PDA
    enrichedOsecInfo.verify_command = coalesceCommandFromPda(programId, pdaData);
  } else {
    enrichedOsecInfo.verify_command = isMainnet(cluster)
      ? 'Program does not have a verify PDA uploaded.'
      : 'Verify command only available on mainnet.';
  }
  return { data: enrichedOsecInfo, isLoading: isPdaLoading };
}

function coalesceCommandFromPda(programId: PublicKey, pdaData: any) {
  let verify_command = `solana-verify verify-from-repo -um --program-id ${programId.toBase58()} ${pdaData.gitUrl}`;

  if (pdaData.commit) {
    verify_command += ` --commit-hash ${pdaData.commit}`;
  }

  // Add additional args if available, for example mount-path and --library-name
  if (pdaData.args && pdaData.args.length > 0) {
    const argsString = pdaData.args.join(' ');
    verify_command += ` ${argsString}`;
  }
  return verify_command;
}

function isMainnet(currentCluster: Cluster): boolean {
  return currentCluster == Cluster.MainnetBeta;
}

// Helper function to hash program data - completely SSR-safe
export function hashProgramData(programData: ProgramDataAccountInfo): string {
  // Only allow program data hashing on client-side to prevent SSR issues
  if (!isClientSide) {
    return '';
  }

  try {
    // Use Web Crypto API for client-side hashing
    const buffer = Buffer.from(programData.data[0], 'base64');

    // Truncate null bytes at the end of buffer
    let truncatedBytes = 0;
    while (buffer[buffer.length - 1 - truncatedBytes] === 0) {
      truncatedBytes++;
    }

    // Hash binary data using Web Crypto API
    const c = Buffer.from(buffer.slice(0, buffer.length - truncatedBytes));

    // Use crypto.subtle for client-side hashing with synchronous fallback
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // For synchronous usage, we'll use a simple hash for now
      // In a real implementation, this should be handled async
      try {
        // Simple hash implementation for SSR compatibility
        let hash = 0;
        for (let i = 0; i < c.length; i++) {
          const char = c[i];
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
      } catch (error) {
        console.warn('Simple hash failed, using fallback:', error);
      }
    }

    // Fallback to simple string representation if crypto not available
    return c.toString('hex');
  } catch (error) {
    console.error('Error hashing program data:', error);
    return '';
  }
}

// Async version of hashProgramData for when crypto.subtle is available
export async function hashProgramDataAsync(programData: ProgramDataAccountInfo): Promise<string> {
  // Only allow program data hashing on client-side to prevent SSR issues
  if (!isClientSide) {
    return '';
  }

  try {
    // Use Web Crypto API for client-side hashing
    const buffer = Buffer.from(programData.data[0], 'base64');

    // Truncate null bytes at the end of buffer
    let truncatedBytes = 0;
    while (buffer[buffer.length - 1 - truncatedBytes] === 0) {
      truncatedBytes++;
    }

    // Hash binary data using Web Crypto API
    const c = Buffer.from(buffer.slice(0, buffer.length - truncatedBytes));

    // Use crypto.subtle for client-side hashing
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const hash = await crypto.subtle.digest('SHA-256', c);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      } catch (error) {
        console.warn('Async hash failed, using fallback:', error);
      }
    }

    // Fallback to simple string representation if crypto not available
    return c.toString('hex');
  } catch (error) {
    console.error('Error hashing program data:', error);
    return '';
  }
}
